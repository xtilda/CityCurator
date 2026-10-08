import { NextResponse } from "next/server";
import { getRoute } from "@/db/queries";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const route = await getRoute((await params).id); return route ? NextResponse.json({ route }) : NextResponse.json({ error: "Route not found" }, { status: 404 }); }
  catch (error) { console.error("Route unavailable", error); return NextResponse.json({ error: "Route temporarily unavailable" }, { status: 503 }); }
}
