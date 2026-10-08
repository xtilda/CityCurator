BEGIN;
CREATE TABLE IF NOT EXISTS routes (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, author TEXT NOT NULL,
 title TEXT NOT NULL, description TEXT NOT NULL, neighborhood TEXT NOT NULL,
 duration INTEGER NOT NULL, mood TEXT NOT NULL, budget TEXT NOT NULL DEFAULT 'Flexible',
 weather TEXT NOT NULL DEFAULT 'Any', solo_friendly INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);
CREATE TABLE IF NOT EXISTS stops (
 id TEXT PRIMARY KEY, route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
 position INTEGER NOT NULL, name TEXT NOT NULL, note TEXT NOT NULL,
 stay_minutes INTEGER NOT NULL DEFAULT 20, official_url TEXT,
 lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stops_route_position ON stops(route_id,position);
CREATE TABLE IF NOT EXISTS saves (
 user_id TEXT NOT NULL, route_id TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(user_id,route_id)
);
CREATE TABLE IF NOT EXISTS event_feeds (
 id TEXT PRIMARY KEY, payload TEXT NOT NULL DEFAULT '[]', checked_at TEXT,
 retry_after BIGINT NOT NULL DEFAULT 0, error TEXT
);
COMMIT;
