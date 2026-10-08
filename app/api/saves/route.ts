import { NextResponse } from "next/server";
import { getVisitor } from "@/app/visitor";
import { getRoute, listSavedRoutes, saveRoute } from "@/db/queries";
export async function GET() {
  const user = await getVisitor();
  if (!user) return NextResponse.json({ error: "Kaydedilen rotaları görmek için giriş yap" }, { status: 401 });
  try { return NextResponse.json({ routes: await listSavedRoutes(user.userId) }); }
  catch (error) { console.error("Saved routes unavailable", error); return NextResponse.json({ error: "Kaydedilen rotalar şu anda yüklenemiyor" }, { status: 503 }); }
}
export async function POST(request: Request) {
  const user = await getVisitor();
  if (!user) return NextResponse.json({ error: "Rota kaydetmek için giriş yap" }, { status: 401 });
  let routeId: unknown;
  try { routeId = (await request.json() as { routeId?: unknown }).routeId; } catch {}
  if (typeof routeId !== "string" || routeId.length > 100) return NextResponse.json({ error: "Geçersiz rota" }, { status: 400 });
  try {
    if (!await getRoute(routeId)) return NextResponse.json({ error: "Rota bulunamadı" }, { status: 404 });
    await saveRoute(user.userId, routeId);return NextResponse.json({ saved: true });
  } catch (error) { console.error("Save failed", error); return NextResponse.json({ error: "Bu rota kaydedilemedi" }, { status: 503 }); }
}
