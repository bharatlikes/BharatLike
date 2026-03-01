/**
 * BharatLike - Comments & Likes API
 * Cloudflare Worker + D1 Database
 *
 * Routes:
 *   GET  /api/comments?slug=xxx        → fetch comments for a post
 *   POST /api/comments                 → submit a new comment
 *   GET  /api/likes?slug=xxx           → get like count for a post
 *   POST /api/likes                    → toggle like (uses IP-based dedup)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.bharatlike.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Comments ────────────────────────────────────────────────
      if (path === '/api/comments') {
        if (request.method === 'GET') {
          return await getComments(request, env, url);
        }
        if (request.method === 'POST') {
          return await postComment(request, env);
        }
      }

      // ── Likes ───────────────────────────────────────────────────
      if (path === '/api/likes') {
        if (request.method === 'GET') {
          return await getLikes(request, env, url);
        }
        if (request.method === 'POST') {
          return await toggleLike(request, env);
        }
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// ── GET /api/comments?slug=xxx ───────────────────────────────────────────────
async function getComments(request, env, url) {
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const { results } = await env.DB.prepare(
    `SELECT id, name, comment, created_at
     FROM comments
     WHERE slug = ? AND approved = 1
     ORDER BY created_at DESC
     LIMIT 100`
  ).bind(slug).all();

  return json({ comments: results });
}

// ── POST /api/comments ───────────────────────────────────────────────────────
async function postComment(request, env) {
  const body = await request.json();
  const { slug, name, comment } = body;

  if (!slug || !name || !comment) {
    return json({ error: 'Missing fields' }, 400);
  }

  // Basic sanitisation
  const cleanName = name.trim().slice(0, 60);
  const cleanComment = comment.trim().slice(0, 1000);

  if (cleanName.length < 2 || cleanComment.length < 3) {
    return json({ error: 'Name or comment too short' }, 400);
  }

  // Simple spam check - block obvious spam patterns
  const spamPatterns = /http[s]?:\/\/|viagra|casino|porn|xxx/i;
  if (spamPatterns.test(cleanComment)) {
    return json({ error: 'Comment rejected' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO comments (slug, name, comment, approved, created_at)
     VALUES (?, ?, ?, 1, datetime('now'))`
  ).bind(slug, cleanName, cleanComment).run();

  return json({ success: true, message: 'Comment posted!' });
}

// ── GET /api/likes?slug=xxx ──────────────────────────────────────────────────
async function getLikes(request, env, url) {
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const row = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM likes WHERE slug = ?`
  ).bind(slug).first();

  // Check if this IP already liked it
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const existing = await env.DB.prepare(
    `SELECT id FROM likes WHERE slug = ? AND ip = ?`
  ).bind(slug, ip).first();

  return json({ count: row.count, liked: !!existing });
}

// ── POST /api/likes ──────────────────────────────────────────────────────────
async function toggleLike(request, env) {
  const body = await request.json();
  const { slug } = body;
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  // Check if already liked
  const existing = await env.DB.prepare(
    `SELECT id FROM likes WHERE slug = ? AND ip = ?`
  ).bind(slug, ip).first();

  if (existing) {
    // Unlike
    await env.DB.prepare(
      `DELETE FROM likes WHERE slug = ? AND ip = ?`
    ).bind(slug, ip).run();
    const row = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM likes WHERE slug = ?`
    ).bind(slug).first();
    return json({ liked: false, count: row.count });
  } else {
    // Like
    await env.DB.prepare(
      `INSERT INTO likes (slug, ip, created_at) VALUES (?, ?, datetime('now'))`
    ).bind(slug, ip).run();
    const row = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM likes WHERE slug = ?`
    ).bind(slug).first();
    return json({ liked: true, count: row.count });
  }
}

// ── Helper ───────────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
