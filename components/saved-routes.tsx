"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RouteCard } from "@/components/route-card";
import type { CityRoute } from "@/lib/routes";
export function SavedRoutes({ signInHref }: { signInHref: string }) {
  const [routes, setRoutes] = useState<CityRoute[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0), [needsSignIn, setNeedsSignIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/saves", { signal: controller.signal }).then(async (response) => {
      if (response.status === 401) { setNeedsSignIn(true);return; }
      if (!response.ok) throw new Error();
      const data = await response.json() as { routes: CityRoute[] };
      setRoutes(data.routes);
    }).catch((cause) => { if (cause?.name !== "AbortError") setError("Kaydedilen rotalar yüklenemedi. Tekrar dene."); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [retry]);
  return <main className="saved-page"><span className="eyebrow">ŞEHİR ROTALARIN</span><h1>Kaydedilen <em>rotalar.</em></h1>{loading ? <p>Rotalar yükleniyor…</p> : needsSignIn ? <div className="empty-state"><h2>Tarayıcı kaydına erişilemiyor.</h2><a href={signInHref} target="_top">Sayfayı yenile</a></div> : error ? <div className="empty-state"><p role="alert">{error}</p><button type="button" onClick={() => { setError("");setLoading(true);setRetry(retry + 1); }}>Tekrar dene</button></div> : routes.length ? <div className="saved-grid">{routes.map((route,index) => <RouteCard key={route.id} route={route} index={index}/>)}</div> : <div className="empty-state"><h2>Henüz rota kaydetmedin.</h2><p>Yeniden keşfetmek istediğin bir rotayı kaydet.</p><Link href="/walks">Rotaları keşfet</Link></div>}</main>;
}
