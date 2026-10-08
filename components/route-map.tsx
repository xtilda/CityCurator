"use client";
import { useEffect, useRef, useState } from "react";
import type { Stop } from "@/lib/routes";
import "leaflet/dist/leaflet.css";

type Props = { stops: Stop[]; onPick?: (point: { lat: number; lng: number }) => void; className?: string };
export function RouteMap({ stops, onPick, className = "" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const pickHandler = useRef(onPick);
  useEffect(() => { pickHandler.current = onPick; }, [onPick]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !container.current) return;
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView([41.014, 28.979], 12);
      map.current = instance;
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(instance);
      layer.current = L.layerGroup().addTo(instance);
      setReady(true);
      instance.on("click", (event: import("leaflet").LeafletMouseEvent) => pickHandler.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
      setTimeout(() => instance.invalidateSize(), 100);
    })();
    return () => { disposed = true; map.current?.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !map.current || !layer.current) return;
      layer.current.clearLayers();
      const points = stops.map((stop) => [stop.lat, stop.lng] as [number, number]);
      stops.forEach((stop, index) => {
        const icon = L.divIcon({ className: "map-pin-wrapper", html: `<span class="map-pin"><b>${index + 1}</b></span>`, iconSize: [32, 38], iconAnchor: [16, 37] });
        L.marker([stop.lat, stop.lng], { icon }).addTo(layer.current!).bindPopup(`<strong>${escapeHtml(stop.name)}</strong>`);
      });
      if (points.length > 1) L.polyline(points, { color: "#d35b3e", weight: 3, opacity: .88, dashArray: "7 8" }).addTo(layer.current);
      if (points.length > 0) map.current.fitBounds(L.latLngBounds(points).pad(.28), { maxZoom: 15, animate: false });
      else map.current.setView([41.014, 28.979], 12);
      setTimeout(() => map.current?.invalidateSize(), 60);
    })();
    return () => { disposed = true; };
  }, [stops, ready]);

  return <div className={`route-map ${className}`} ref={container} role="application" aria-label={onPick ? "Durak konumu seçmek için haritaya tıkla" : "Rota haritası"} />;
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char); }
