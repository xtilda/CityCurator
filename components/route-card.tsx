import { Clock3, MapPin } from "lucide-react";
import { estimatedWalkKm, moodLabel, type CityRoute } from "@/lib/routes";
export function RouteCard({ route, active, onSelect, index }: { route: CityRoute; active?: boolean; onSelect?: () => void; index?: number }) {
  return <article className={`route-card ${active ? "active" : ""}`}>
    {route.cover && <img src={route.cover} alt={`Sokak manzarası: ${route.neighborhood}`} className="route-card-image" loading="lazy" />}
    <div className="route-card-main">
      <div className="route-card-top"><span className="card-index">{String((index ?? 0) + 1).padStart(2, "0")} / {moodLabel(route.mood)}</span><span className="card-meta"><Clock3 size={14}/> {route.duration} dk</span></div>
      <h3>{route.title}</h3><p>{route.description}</p>
      <div className="route-facts"><span>≈ {estimatedWalkKm(route.stops)} km yürüyüş</span><span>{route.budget === "Free" ? "Ücretsiz yürüyüş" : route.budget === "Low" ? "Düşük bütçe" : "Esnek bütçe"}</span><span>Başlangıç: {route.stops[0]?.name}</span></div>
      <div className="route-card-footer"><span><MapPin size={14}/> {route.neighborhood} · {route.stops.length} durak</span><a href={`/routes/${encodeURIComponent(route.id)}`} aria-label={`${route.title} rotasını aç`}>Rotayı incele</a></div>
      {onSelect && <button className="map-preview-button" onClick={onSelect} type="button">{active ? "Haritada gösteriliyor" : "Haritada göster"}</button>}
    </div>
  </article>;
}
