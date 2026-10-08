import { database } from "@/db/postgres";
import type { CityRoute, Stop } from "@/lib/routes";
import { sampleRoutes } from "@/lib/routes";

function db() {
  const connection = database();
  if (!connection) throw new Error("Route storage is unavailable");
  return connection;
}

type RouteRow = Omit<CityRoute, "stops" | "cover" | "coverCredit" | "createdAt" | "soloFriendly"> & { owner_id: string; created_at: string; solo_friendly: number };
type StopRow = Stop & { route_id: string; stay_minutes: number; official_url: string | null };

function hydrate(row: RouteRow, stopRows: StopRow[]): CityRoute {
  return {
    id: row.id, title: row.title, description: row.description,
    neighborhood: row.neighborhood, duration: row.duration, mood: row.mood,
    budget: row.budget ?? "Flexible", weather: row.weather ?? "Any", soloFriendly: Boolean(row.solo_friendly),
    author: row.author, createdAt: row.created_at,
    stops: stopRows.map(({ id, position, name, note, lat, lng, stay_minutes, official_url }) => ({ id, position, name, note, lat, lng, stayMinutes: stay_minutes, officialUrl: official_url ?? undefined })),
  };
}

export async function listRoutes(): Promise<CityRoute[]> {
  if (!database()) return sampleRoutes;
  const routeRows = await db().prepare("SELECT * FROM routes ORDER BY created_at DESC LIMIT 100").all<RouteRow>();
  const rows = routeRows.results ?? [];
  if (!rows.length) return sampleRoutes;
  const stopRows = await db().prepare("SELECT * FROM stops ORDER BY route_id, position").all<StopRow>();
  const byRoute = new Map<string, StopRow[]>();
  for (const stop of stopRows.results ?? []) byRoute.set(stop.route_id, [...(byRoute.get(stop.route_id) ?? []), stop]);
  return [...rows.map((row) => hydrate(row, byRoute.get(row.id) ?? [])), ...sampleRoutes];
}

export async function getRoute(id: string): Promise<CityRoute | null> {
  const sample = sampleRoutes.find((route) => route.id === id);
  if (sample) return sample;
  const row = await db().prepare("SELECT * FROM routes WHERE id = ?").bind(id).first<RouteRow>();
  if (!row) return null;
  const result = await db().prepare("SELECT * FROM stops WHERE route_id = ? ORDER BY position").bind(id).all<StopRow>();
  return hydrate(row, result.results ?? []);
}

export async function createRoute(route: CityRoute, ownerId: string): Promise<void> {
  const dayStart = new Date().toISOString().slice(0,10);
  const statements = [
    db().prepare("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))").bind(ownerId + dayStart),
    db().prepare("INSERT INTO routes (id, owner_id, author, title, description, neighborhood, duration, mood, budget, weather, solo_friendly, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM routes WHERE owner_id=? AND created_at>=?) < 10")
      .bind(route.id, ownerId, route.author, route.title, route.description, route.neighborhood, route.duration, route.mood, route.budget, route.weather, route.soloFriendly ? 1 : 0, route.createdAt, ownerId, dayStart),
    ...route.stops.map((stop) => db().prepare("INSERT INTO stops (id, route_id, position, name, note, lat, lng, stay_minutes, official_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(stop.id, route.id, stop.position, stop.name, stop.note, stop.lat, stop.lng, stop.stayMinutes ?? 20, stop.officialUrl ?? null)),
  ];
  await db().batch(statements);
}

export async function isSaved(userId: string, routeId: string): Promise<boolean> {
  return !!(await db().prepare("SELECT 1 FROM saves WHERE user_id = ? AND route_id = ?").bind(userId, routeId).first());
}

export async function saveRoute(userId: string, routeId: string): Promise<void> {
  await db().prepare("INSERT OR IGNORE INTO saves (user_id, route_id, created_at) VALUES (?, ?, ?)")
    .bind(userId, routeId, new Date().toISOString()).run();
}

export async function unsaveRoute(userId: string, routeId: string): Promise<void> {
  await db().prepare("DELETE FROM saves WHERE user_id = ? AND route_id = ?").bind(userId, routeId).run();
}

export async function listSavedRoutes(userId: string): Promise<CityRoute[]> {
  const result = await db().prepare("SELECT route_id FROM saves WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all<{ route_id: string }>();
  const routes = await Promise.all((result.results ?? []).map((row) => getRoute(row.route_id)));
  return routes.filter((route): route is CityRoute => route !== null);
}
