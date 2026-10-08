import { notFound } from "next/navigation";
import { getVisitor } from "@/app/visitor";
import { getRoute } from "@/db/queries";
import { sampleRoutes } from "@/lib/routes";
import { SiteHeader } from "@/components/site-header";
import { RouteDetail } from "@/components/route-detail";
export const dynamic = "force-dynamic";
export default async function RoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let route = sampleRoutes.find((item) => item.id === id) ?? null;
  if (!route) { try { route = await getRoute(id); } catch { return <><SiteHeader/><main className="error-page"><h1>Rota yüklenemedi</h1><p>Biraz sonra tekrar dene.</p></main></>; } }
  if (!route) notFound();
  const user = await getVisitor();
  return <><SiteHeader/><RouteDetail route={route} signedIn={!!user} signInHref={"/saved"}/></>;
}
