# Setting Up Real Comments & Likes on BharatLike
## Uses: Cloudflare D1 (free database) + Cloudflare Workers (free serverless API)

---

## Step 1 — Install Wrangler CLI

Open VS Code terminal and run:

```bash
npm install -g wrangler
wrangler login
```

This opens a browser window — log in with your Cloudflare account.

---

## Step 2 — Create the D1 Database

```bash
wrangler d1 create bharatlike-blog
```

This outputs something like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy that ID.** Open `workers/comments-api/wrangler.toml` and replace:
```
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```
with your actual ID.

---

## Step 3 — Create the Database Tables

```bash
cd workers/comments-api

wrangler d1 execute bharatlike-blog --file=schema.sql
```

This creates the `comments` and `likes` tables in your database.

---

## Step 4 — Deploy the Worker

```bash
wrangler deploy
```

After deploying, it gives you a URL like:
```
https://bharatlike-comments.bharatlike.workers.dev
```

Your API is now live.

---

## Step 5 — Test the API

Open your browser and visit:
```
https://bharatlike-comments.bharatlike.workers.dev/api/comments?slug=how-to-grow-youtube-channel-india
```

You should see:
```json
{ "comments": [] }
```

---

## Step 6 — Update the Worker URL in Blog Posts (if different)

The blog posts currently point to:
```
https://bharatlike-comments.bharatlike.workers.dev
```

If your worker URL is different, find and replace it in all 4 blog HTML files.

---

## Step 7 — Push & Deploy

```bash
git add .
git commit -m "Add real comments and likes with Cloudflare D1"
git push
```

Cloudflare Pages rebuilds automatically. Comments and likes are now
shared across all users visiting your site!

---

## How it Works

```
User visits blog
      ↓
Browser calls /api/comments?slug=xxx  ←──┐
      ↓                                   │
Cloudflare Worker receives request        │
      ↓                                   │
Queries D1 SQLite database                │
      ↓                                   │
Returns JSON → renders on page ───────────┘
```

- **Likes** are tracked per IP address — one like per user per post
- **Comments** are stored permanently in D1 database
- **Free limits:** 100,000 Worker requests/day, 500MB D1 storage — more than enough

---

## Managing Comments (Moderation)

To view all comments in your database:
```bash
wrangler d1 execute bharatlike-blog --command="SELECT * FROM comments ORDER BY created_at DESC"
```

To delete a spam comment (replace ID with actual comment id):
```bash
wrangler d1 execute bharatlike-blog --command="DELETE FROM comments WHERE id = 5"
```

To hide a comment without deleting (set approved = 0):
```bash
wrangler d1 execute bharatlike-blog --command="UPDATE comments SET approved = 0 WHERE id = 5"
```
