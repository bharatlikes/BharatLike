-- BharatLike Blog Database Schema
-- Run this in Cloudflare D1 console to set up tables

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  comment    TEXT    NOT NULL,
  approved   INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);

-- Likes table (one like per IP per post)
CREATE TABLE IF NOT EXISTS likes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  ip         TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(slug, ip)
);

CREATE INDEX IF NOT EXISTS idx_likes_slug ON likes(slug);
