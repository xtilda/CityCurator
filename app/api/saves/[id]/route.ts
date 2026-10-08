import { NextResponse } from "next/server";
import { getVisitor } from "@/app/visitor";
import { isSaved, unsaveRoute } from "@/db/queries";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVisitor();if (!user) return NextResponse.json({ error: "Kayıt durumunu görmek için giriş yap" }, { status: 401 });
  try { return NextResponse.json({ saved: await isSaved(user.userId, (await params).id) }); }
  catch (error) { console.error("Kayıt durumu yüklenemedi", error); return NextResponse.json({ error: "Kayıt durumu yüklenemedi" }, { status: 503 }); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVisitor();if (!user) return NextResponse.json({ error: "Önce giriş yap" }, { status: 401 });
  try { await unsaveRoute(user.userId, (await params).id);return NextResponse.json({ saved: false }); }
  catch (error) { console.error("Unsave failed", error);return NextResponse.json({ error: "Kaydedilen rota kaldırılamadı" }, { status: 503 }); }
}
