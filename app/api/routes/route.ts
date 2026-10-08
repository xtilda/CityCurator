import { NextResponse } from "next/server";
import { getVisitor } from "@/app/visitor";
import { createRoute, listRoutes } from "@/db/queries";
import { moods, type CityRoute, type Stop } from "@/lib/routes";

export async function GET() {
  try { return NextResponse.json({ routes: await listRoutes() }); }
  catch (error) { console.error("Route list unavailable", error); return NextResponse.json({ error: "Rotalar şu anda yüklenemiyor" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const user = await getVisitor();
  if (!user) return NextResponse.json({ error: "Rota yayımlamak için giriş yap" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Geçersiz rota bilgileri" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const neighborhood = typeof body.neighborhood === "string" ? body.neighborhood.trim() : "";
  const duration = Number(body.duration);
  const mood = typeof body.mood === "string" ? body.mood : "";
  const budget = typeof body.budget === "string" ? body.budget : "Flexible";
  const weather = typeof body.weather === "string" ? body.weather : "Any";
  const soloFriendly = body.soloFriendly === true;
  const entries = Array.isArray(body.stops) ? body.stops : [];
  if (!title || title.length > 90 || !description || description.length > 500 || !neighborhood || neighborhood.length > 80 || !Number.isInteger(duration) || duration < 30 || duration > 480 || !moods.includes(mood as typeof moods[number]) || mood === "All" || !["Free", "Low", "Flexible"].includes(budget) || !["Any", "Rain-friendly", "Dry day"].includes(weather) || (body.soloFriendly !== undefined && typeof body.soloFriendly !== "boolean") || entries.length < 2 || entries.length > 8) {
    return NextResponse.json({ error: "Başlık, açıklama ve 2–8 durak ekle" }, { status: 400 });
  }
  const valid = entries.every((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const stop = entry as Record<string, unknown>;
    const url = stop.officialUrl;
    const validUrl = url === undefined || url === "" || (typeof url === "string" && url.length <= 300 && /^https:\/\//i.test(url) && (() => { try { return new URL(url).protocol === "https:"; } catch { return false; } })());
    return typeof stop.name === "string" && !!stop.name.trim() && stop.name.trim().length <= 80 && typeof stop.note === "string" && stop.note.trim().length <= 280 && typeof stop.lat === "number" && Number.isFinite(stop.lat) && stop.lat >= -90 && stop.lat <= 90 && typeof stop.lng === "number" && Number.isFinite(stop.lng) && stop.lng >= -180 && stop.lng <= 180 && Number.isInteger(stop.stayMinutes ?? 20) && Number(stop.stayMinutes ?? 20) >= 5 && Number(stop.stayMinutes ?? 20) <= 180 && validUrl;
  });
  if (!valid) return NextResponse.json({ error: "Durak adlarını ve haritadaki konumları kontrol et" }, { status: 400 });
  const id = crypto.randomUUID();
  const stops: Stop[] = entries.map((entry: Record<string, unknown>, position: number) => ({
    id: crypto.randomUUID(), position, name: String(entry.name).trim(), note: String(entry.note).trim(), lat: Number(entry.lat), lng: Number(entry.lng), stayMinutes: Number(entry.stayMinutes ?? 20), officialUrl: typeof entry.officialUrl === "string" ? entry.officialUrl.trim() || undefined : undefined,
  }));
  const route: CityRoute = { id, title, description, neighborhood, duration, mood, budget: budget as CityRoute["budget"], weather: weather as CityRoute["weather"], soloFriendly, author: user.fullName ?? user.email.split("@")[0], createdAt: new Date().toISOString(), stops };
  try { await createRoute(route, user.userId); return NextResponse.json({ route }, { status: 201 }); }
  catch (error) { console.error("Route publish failed", error); return NextResponse.json({ error: "Yayımlanamadı. Günlük sınırın (10 rota) dolmuş olabilir veya veritabanına ulaşılamıyor. Taslağın hâlâ bu sayfada." }, { status: 503 }); }
}
