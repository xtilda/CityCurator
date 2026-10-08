"use client";
import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RouteMap } from "@/components/route-map";
import { RouteCard } from "@/components/route-card";
import { distanceKm, moods, moodLabel, type CityRoute } from "@/lib/routes";

export function Explore({ initialRoutes }: { initialRoutes: CityRoute[] }) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState("All");
  const [shortOnly, setShortOnly] = useState(false), [freeOnly, setFreeOnly] = useState(false), [rainOnly, setRainOnly] = useState(false), [soloOnly, setSoloOnly] = useState(false);
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null), [locating, setLocating] = useState(false);
  const [activeId, setActiveId] = useState(initialRoutes[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/routes").then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { routes: CityRoute[] };
      setRoutes(data.routes);
    }).catch(() => setNotice("Topluluk rotaları şu anda yüklenemiyor. Hazır rotaları keşfedebilirsin."));
  }, []);
  const filtered = useMemo(() => routes.filter((route) =>
    (mood === "All" || route.mood === mood) &&
    `${route.title} ${route.neighborhood} ${route.description}`.toLowerCase().includes(query.toLowerCase()) &&
    (!shortOnly || route.duration <= 120) && (!freeOnly || route.budget === "Free") &&
    (!rainOnly || route.weather === "Rain-friendly") && (!soloOnly || route.soloFriendly) &&
    (!nearby || (route.stops[0] && distanceKm(nearby, route.stops[0]) <= 3))
  ).sort((a, b) => nearby ? distanceKm(nearby, a.stops[0]) - distanceKm(nearby, b.stops[0]) : 0), [routes, mood, query, shortOnly, freeOnly, rainOnly, soloOnly, nearby]);
  const active = filtered.find((route) => route.id === activeId) ?? filtered[0];
  function toggleNearby() {
    if (nearby) { setNearby(null); return; }
    if (!navigator.geolocation) { setNotice("Tarayıcın konumu desteklemiyor. Tüm rotaları keşfetmeye devam edebilirsin."); return; }
    setLocating(true);setNotice("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setNearby({ lat: coords.latitude, lng: coords.longitude });setLocating(false); },
      () => { setNotice("Konum alınamadı. Tüm rotaları keşfetmeye devam edebilirsin.");setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "filter_city_routes", title: "Filter city routes",
      description: "Filter the visible City Curator routes by mood and search text.",
      inputSchema: { type: "object", properties: { mood: { type: "string", enum: [...moods] }, query: { type: "string" } }, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== "object") throw new Error("Expected a filter object");
        const values = input as { mood?: unknown; query?: unknown };
        if (values.mood !== undefined && (typeof values.mood !== "string" || !moods.includes(values.mood as typeof moods[number]))) throw new Error("Unknown mood");
        if (values.query !== undefined && (typeof values.query !== "string" || values.query.length > 100)) throw new Error("Invalid query");
        const nextMood = values.mood as string | undefined ?? "All";
        const nextQuery = values.query as string | undefined ?? "";
        setMood(nextMood);setQuery(nextQuery);
        const count = routes.filter((route) => (nextMood === "All" || route.mood === nextMood) && `${route.title} ${route.neighborhood} ${route.description}`.toLowerCase().includes(nextQuery.toLowerCase()) && (!shortOnly || route.duration <= 120) && (!freeOnly || route.budget === "Free") && (!rainOnly || route.weather === "Rain-friendly") && (!soloOnly || route.soloFriendly) && (!nearby || (route.stops[0] && distanceKm(nearby, route.stops[0]) <= 3))).length;
        return { mood: nextMood, query: nextQuery, count };
      },
    }, { signal: controller.signal })).catch(() => {});
    return () => controller.abort();
  }, [routes, shortOnly, freeOnly, rainOnly, soloOnly, nearby]);
  return <main className="explore-page">
    <div className="explore-heading"><div><span className="eyebrow">İSTANBUL’U ADIM ADIM KEŞFET</span><h1>Şehrin içinde <em>kendine bir rota.</em></h1><p>Sahilden ara sokaklara, sanattan yeşil alanlara. Bugünkü ruhuna uygun bir yürüyüş seç.</p></div><span className="heading-coordinate">41° N&nbsp; / &nbsp;29° E<br/>İSTANBUL</span></div>
    <div className="explore-layout"><section className="route-list" aria-label="Şehir rotaları">
      <div className="list-toolbar"><div className="search-wrap"><Search size={19}/><Input aria-label="Rotalarda ara" placeholder="Semt, yer veya rota ara" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      <div className="mood-filters" aria-label="Rotanın temasını seç">{moods.map((item) => <button key={item} type="button" className={mood === item ? "selected" : ""} onClick={() => setMood(item)} aria-pressed={mood === item}>{moodLabel(item)}</button>)}</div>
      <div className="practical-filters" aria-label="Rota özellikleri">
        <button type="button" className={shortOnly ? "selected" : ""} aria-pressed={shortOnly} onClick={() => setShortOnly(!shortOnly)}>2 saate kadar</button>
        <button type="button" className={freeOnly ? "selected" : ""} aria-pressed={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Ücretsiz</button>
        <button type="button" className={rainOnly ? "selected" : ""} aria-pressed={rainOnly} onClick={() => setRainOnly(!rainOnly)}>Yağmura uygun</button>
        <button type="button" className={soloOnly ? "selected" : ""} aria-pressed={soloOnly} onClick={() => setSoloOnly(!soloOnly)}>Tek başına</button>
        <button type="button" className={nearby ? "selected" : ""} aria-pressed={!!nearby} disabled={locating} onClick={toggleNearby}><LocateFixed size={15}/> {locating ? "Konum alınıyor…" : "3 km yakınımda"}</button>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      <div className="list-count">{filtered.length} KEŞFEDİLECEK ROTA</div>
      {filtered.length ? <div className="cards">{filtered.map((route, index) => <RouteCard key={route.id} route={route} index={index} active={active?.id === route.id} onSelect={() => { setActiveId(route.id);if (window.matchMedia("(max-width: 760px)").matches) document.querySelector(".explore-map-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}/>)}</div> : <div className="empty-state"><h2>Uygun rota bulunamadı.</h2><p>Başka bir filtre veya arama dene. Yakınlık, rotanın başlangıç noktasına göre hesaplanır.</p><button type="button" onClick={() => { setMood("All");setQuery("");setShortOnly(false);setFreeOnly(false);setRainOnly(false);setSoloOnly(false);setNearby(null); }}>Filtreleri temizle</button></div>}
    </section><aside className="explore-map-panel"><div className="map-panel-heading"><div><span className="eyebrow">HARİTADA</span><strong>{active?.title ?? "İstanbul"}</strong></div><span>{active?.stops.length ?? 0} DURAK</span></div><RouteMap stops={active?.stops ?? []} className="explore-map"/><div className="map-panel-footer"><span>Durakları görmek için bir rotayı haritada göster.</span><span>İSTANBUL / 2026</span></div></aside></div>
  </main>;
}
