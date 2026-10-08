"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Navigation, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/route-map";
import { estimatedWalkKm, moodLabel, type CityRoute } from "@/lib/routes";
import { walkingDirectionsUrl } from "@/lib/maps";

export function RouteDetail({ route, signedIn, signInHref }: { route: CityRoute; signedIn: boolean; signInHref: string }) {
  const [saved, setSaved] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [shareLink, setShareLink] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false), [saveLoading, setSaveLoading] = useState(signedIn);
  const [walkStarted, setWalkStarted] = useState(false), [activeStop, setActiveStop] = useState(0);
  const directionsUrl = walkingDirectionsUrl(route.stops);
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    fetch(`/api/saves/${encodeURIComponent(route.id)}`, { signal: controller.signal }).then(async (response) => {
      if (response.status === 401) { setNeedsSignIn(true);return; }
      if (!response.ok) throw new Error("Kayıt durumu yüklenemedi.");
      const data = await response.json() as { saved: boolean };
      setSaved(data.saved);
    }).catch((error) => { if (error?.name !== "AbortError") setNotice("Kayıt durumu yüklenemedi. Sayfayı yenilemeyi dene."); })
      .finally(() => setSaveLoading(false));
    return () => controller.abort();
  }, [route.id, signedIn]);
  async function toggleSave() {
    setBusy(true);setNotice("");
    try {
      const response = await fetch(saved ? `/api/saves/${encodeURIComponent(route.id)}` : "/api/saves", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, ...(saved ? {} : { body: JSON.stringify({ routeId: route.id }) }) });
      if (response.status === 401) { setNeedsSignIn(true);setNotice("Bu rotayı kaydetmek için giriş yap.");return; }
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string };throw new Error(data.error || "Kaydedilen rotalar güncellenemedi."); }
      setSaved(!saved);setNotice(saved ? "Rota kaydedilenlerden kaldırıldı." : "Rota kaydedildi.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Kaydedilen rotalar güncellenemedi. Tekrar dene."); } finally { setBusy(false); }
  }
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: route.title, url });setNotice("Rota paylaşıldı.");setShareLink("");return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url);setNotice("Bağlantı kopyalandı.");setShareLink(""); }
    catch { setShareLink(url);setNotice("Aşağıdaki bağlantıyı seçip kopyala."); }
  }
  return <main className="detail-page">
    <Link className="back-link" href="/walks"><ArrowLeft size={17}/> Tüm rotalar</Link>
    <div className="detail-heading"><div><span className="eyebrow">{route.neighborhood} / {moodLabel(route.mood)}</span><h1>{route.title}</h1><p>{route.description}</p><div className="detail-meta"><span><Clock3 size={17}/>{route.duration} dk</span><span><MapPin size={17}/>{route.stops.length} durak</span><span>≈ {estimatedWalkKm(route.stops)} km yürüyüş</span><span>{route.budget === "Free" ? "Ücretsiz yürüyüş" : route.budget === "Low" ? "Düşük bütçe" : "Esnek bütçe"}</span><span>Hazırlayan: {route.author}</span></div></div><div className="detail-actions">
      {signedIn && !needsSignIn ? <Button className="save-button" variant="outline" disabled={busy || saveLoading} onClick={toggleSave}>{saved ? <Check size={17}/> : <Bookmark size={17}/>} {saveLoading ? "Kontrol ediliyor…" : saved ? "Kaydedildi" : "Rotayı kaydet"}</Button> : <Button className="save-button" variant="outline" asChild><a href={signInHref} target="_top"><Bookmark size={17}/> Kaydetmek için giriş yap</a></Button>}
      <Button className="share-button" variant="outline" onClick={share}><Share2 size={17}/> Paylaş</Button>
      {directionsUrl && <Button className="directions-button" asChild><a href={directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17}/> Yürüyüş yolunu aç</a></Button>}
    </div></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {shareLink && <input className="share-link" aria-label="Kopyalanacak rota bağlantısı" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} onClick={(event) => event.currentTarget.select()} />}
    <section className="walk-mode" aria-label="Rotayı takip et">
      {!walkStarted ? <><div><span className="eyebrow">YOLA ÇIK</span><h2>Yürüyüşe hazır mısın?</h2><p>{route.stops[0]?.name} noktasından başla. Durakları kendi hızında keşfet.</p></div><Button type="button" onClick={() => { setActiveStop(0);setWalkStarted(true); }}>Rotayı başlat</Button></> : <><div className="walk-current"><span className="eyebrow">DURAK {activeStop + 1} / {route.stops.length}</span><h2>{route.stops[activeStop].name}</h2><p>{route.stops[activeStop].note}</p><span className="walk-stay">Yaklaşık {route.stops[activeStop].stayMinutes ?? 20} dk ayır</span><div className="walk-links"><a href={`https://www.google.com/maps/search/?api=1&query=${route.stops[activeStop].lat}%2C${route.stops[activeStop].lng}`} target="_blank" rel="noopener noreferrer">Haritada aç</a>{route.stops[activeStop].officialUrl && <a href={route.stops[activeStop].officialUrl} target="_blank" rel="noopener noreferrer">Ziyaret bilgileri</a>}</div></div><div className="walk-controls"><Button variant="outline" type="button" disabled={activeStop === 0} onClick={() => setActiveStop(activeStop - 1)}><ChevronLeft size={16}/> Önceki</Button><Button type="button" onClick={() => activeStop < route.stops.length - 1 ? setActiveStop(activeStop + 1) : setWalkStarted(false)}>{activeStop < route.stops.length - 1 ? "Sonraki durak" : "Rotayı bitir"} <ChevronRight size={16}/></Button></div></>}
    </section>
    {route.cover && <figure className="detail-cover"><img src={route.cover} alt={`Çevre manzarası: ${route.neighborhood}`} /><figcaption>{route.coverCredit && <>Fotoğraf: <a href={route.coverCredit.source} target="_blank" rel="noopener noreferrer">{route.coverCredit.name}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">{route.coverCredit.license}</a> · boyutlandırıldı</>}</figcaption></figure>}
    <div className="detail-layout"><section className="stop-section"><div className="section-heading"><span className="eyebrow">DURAKLAR</span><strong>Kendi hızında keşfet.</strong></div><ol className="stop-list">{route.stops.map((stop, index) => <li key={stop.id}><span className="stop-number">{String(index+1).padStart(2,"0")}</span><div><h2>{stop.name}</h2><p>{stop.note}</p><span className="stop-time"><Clock3 size={15}/> Yaklaşık {stop.stayMinutes ?? 20} dk</span>{stop.photo && <figure className="stop-photo"><img src={stop.photo} alt={`Fotoğraf: ${stop.name}`} loading="lazy"/><figcaption>{stop.photoCredit && <>Fotoğraf: <a href={stop.photoCredit.source} target="_blank" rel="noopener noreferrer">{stop.photoCredit.name}</a> · {stop.photoCredit.license} · boyutlandırıldı</>}</figcaption></figure>}<div className="stop-links"><a href={`https://www.openstreetmap.org/?mlat=${stop.lat}&mlon=${stop.lng}#map=16/${stop.lat}/${stop.lng}`} target="_blank" rel="noopener noreferrer">Konumu aç</a>{stop.officialUrl && <a href={stop.officialUrl} target="_blank" rel="noopener noreferrer">Ziyaret bilgileri</a>}</div></div></li>)}</ol></section><div className="detail-map-wrap"><RouteMap stops={route.stops} className="detail-map"/></div></div>
  </main>;
}
