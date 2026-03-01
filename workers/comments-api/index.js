/**
 * BharatLike - Comments & Likes API
 * Cloudflare Worker + D1 Database
 *
 * Routes:
 *   GET  /api/comments?slug=xxx              → fetch comments for a post
 *   POST /api/comments                       → submit a new comment
 *   GET  /api/likes?slug=xxx&did=xxx         → get like count + whether this device liked
 *   POST /api/likes                          → toggle like (device_id based dedup)
 */

const ALLOWED_ORIGINS = [
  'https://www.bharatlike.com',
  'https://bharatlike.com',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function json(data, status = 200, corsHeaders) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    const CORS_HEADERS = getCorsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/comments') {
        if (request.method === 'GET') return await getComments(request, env, url, CORS_HEADERS);
        if (request.method === 'POST') return await postComment(request, env, CORS_HEADERS);
      }
      if (path === '/api/likes') {
        if (request.method === 'GET') return await getLikes(request, env, url, CORS_HEADERS);
        if (request.method === 'POST') return await toggleLike(request, env, CORS_HEADERS);
      }
      return json({ error: 'Not found' }, 404, CORS_HEADERS);
    } catch (err) {
      return json({ error: err.message }, 500, CORS_HEADERS);
    }
  },
};

// ── GET /api/comments?slug=xxx ───────────────────────────────────────────────
async function getComments(request, env, url, CORS_HEADERS) {
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'Missing slug' }, 400, CORS_HEADERS);

  const { results } = await env.DB.prepare(
    `SELECT id, name, comment, created_at
     FROM comments
     WHERE slug = ? AND approved = 1
     ORDER BY created_at DESC
     LIMIT 100`
  ).bind(slug).all();

  return json({ comments: results }, 200, CORS_HEADERS);
}

// ── POST /api/comments ───────────────────────────────────────────────────────
async function postComment(request, env, CORS_HEADERS) {
  const body = await request.json();
  const { slug, name, comment } = body;

  if (!slug || !name || !comment) return json({ error: 'Missing fields' }, 400, CORS_HEADERS);

  const cleanName = name.trim().slice(0, 60);
  const cleanComment = comment.trim().slice(0, 1000);

  if (cleanName.length < 2 || cleanComment.length < 3)
    return json({ error: 'Name or comment too short' }, 400, CORS_HEADERS);

  const spamPatterns = /http[s]?:\/\/|viagra|casino|porn|xxx/i;
  if (spamPatterns.test(cleanComment)) return json({ error: 'Comment rejected' }, 400, CORS_HEADERS);

  await env.DB.prepare(
    `INSERT INTO comments (slug, name, comment, approved, created_at)
     VALUES (?, ?, ?, 1, datetime('now'))`
  ).bind(slug, cleanName, cleanComment).run();

  return json({ success: true, message: 'Comment posted!' }, 200, CORS_HEADERS);
}

// ── GET /api/likes?slug=xxx&did=xxx ─────────────────────────────────────────
async function getLikes(request, env, url, CORS_HEADERS) {
  const slug = url.searchParams.get('slug');
  const deviceId = url.searchParams.get('did') || '';
  if (!slug) return json({ error: 'Missing slug' }, 400, CORS_HEADERS);

  const row = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM likes WHERE slug = ?`
  ).bind(slug).first();

  let liked = false;
  if (deviceId) {
    const existing = await env.DB.prepare(
      `SELECT id FROM likes WHERE slug = ? AND device_id = ?`
    ).bind(slug, deviceId).first();
    liked = !!existing;
  }

  return json({ count: row.count, liked }, 200, CORS_HEADERS);
}

// ── POST /api/likes ──────────────────────────────────────────────────────────
async function toggleLike(request, env, CORS_HEADERS) {
  const body = await request.json();
  const { slug, device_id } = body;

  if (!slug) return json({ error: 'Missing slug' }, 400, CORS_HEADERS);
  if (!device_id) return json({ error: 'Missing device_id' }, 400, CORS_HEADERS);

  // Validate device_id: alphanumeric + hyphens only, max 64 chars
  if (!/^[a-zA-Z0-9\-]{8,64}$/.test(device_id)) {
    return json({ error: 'Invalid device_id' }, 400, CORS_HEADERS);
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM likes WHERE slug = ? AND device_id = ?`
  ).bind(slug, device_id).first();

  if (existing) {
    await env.DB.prepare(
      `DELETE FROM likes WHERE slug = ? AND device_id = ?`
    ).bind(slug, device_id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO likes (slug, device_id, created_at) VALUES (?, ?, datetime('now'))`
    ).bind(slug, device_id).run();
  }

  const row = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM likes WHERE slug = ?`
  ).bind(slug).first();

  return json({ liked: !existing, count: row.count }, 200, CORS_HEADERS);
}
