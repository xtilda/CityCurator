"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteMap } from "@/components/route-map";
import { moods, moodLabel, budgetLabel, weatherLabel, type Stop } from "@/lib/routes";

export function CreateRoute() {
  const router=useRouter();
  const [title, setTitle] = useState(""), [description, setDescription] = useState(""), [neighborhood, setNeighborhood] = useState(""), [duration, setDuration] = useState("120"), [mood, setMood] = useState("Slow day");
  const [budget, setBudget] = useState("Flexible"), [weather, setWeather] = useState("Any"), [soloFriendly, setSoloFriendly] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [stopName, setStopName] = useState(""), [stopNote, setStopNote] = useState(""), [stopMinutes, setStopMinutes] = useState("20"), [stopUrl, setStopUrl] = useState("");
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  function addStop() {
    if (!point || !stopName.trim()) { setError("Haritada bir nokta seç ve durağa isim ver.");return; }
    const minutes = Number(stopMinutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) { setError("Durak süresini 5 ile 180 dakika arasında seç.");return; }
    if (stopUrl.trim()) { try { if (new URL(stopUrl.trim()).protocol !== "https:") throw new Error(); } catch { setError("Resmî site için https ile başlayan tam bağlantıyı kullan.");return; } }
    setStops([...stops, { id: crypto.randomUUID(), position: stops.length, name: stopName.trim(), note: stopNote.trim(), lat: point.lat, lng: point.lng, stayMinutes: minutes, officialUrl: stopUrl.trim() || undefined }]);
    setPoint(null);setStopName("");setStopNote("");setStopMinutes("20");setStopUrl("");setError("");
  }
  function moveStop(index: number, direction: number) {
    const copy = [...stops], next = index+direction;
    if (next < 0 || next >= copy.length) return;
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setStops(copy.map((stop, position) => ({ ...stop, position })));
  }
  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");
    if (stops.length < 2) { setError("Rotayı yayımlamak için en az iki durak ekle.");return; }
    setBusy(true);
    try {
      const response = await fetch("/api/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, neighborhood, duration: Number(duration), mood, budget, weather, soloFriendly, stops }) });
      const result = await response.json() as { error?: string; route?: { id: string } };
      if (!response.ok) throw new Error(result.error || "Rota yayımlanamadı.");
      if (!result.route?.id) throw new Error("Rota oluşturulamadı. Tekrar dene.");
      router.push(`/routes/${encodeURIComponent(result.route.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Yayımlanamadı. Taslağın hâlâ burada."); }
    finally { setBusy(false); }
  }
  return <main className="create-page"><div className="create-heading"><span className="eyebrow">SENİN ŞEHRİN, SENİN ROTAN</span><h1>Paylaşmaya değer <em>bir rota oluştur.</em></h1><p>Birkaç yer seç, sıralarını düzenle ve seni neden etkilediklerini anlat. Yayımladığın rota herkes tarafından görülebilir.</p></div>
    <aside className="create-planner-callout"><div><strong>Etkinliklerden bir gün planı mı oluşturmak istiyorsun?</strong><p>Resmî programdan seç, yakın kültür duraklarını önerilerle ekle.</p></div><Link href="/planner">Gün rotası oluştur</Link></aside><form onSubmit={publish} className="create-layout"><section className="editor-panel"><div className="form-section"><span className="section-step">01 / ROTA FİKRİ</span><label htmlFor="title">Rota başlığı</label><Input id="title" required maxLength={90} placeholder="Kitapçılar arasında bir öğleden sonra" value={title} onChange={(e) => setTitle(e.target.value)}/><label htmlFor="description">Kısa bir açıklama</label><Textarea id="description" required maxLength={500} rows={3} placeholder="Bu rotayı senin için özel yapan ne?" value={description} onChange={(e) => setDescription(e.target.value)}/><div className="form-row"><div><label htmlFor="neighborhood">Semt</label><Input id="neighborhood" required maxLength={80} placeholder="Kadıköy · Moda" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}/></div><div><label htmlFor="duration">Süre (dakika)</label><Input id="duration" type="number" min={30} max={480} required value={duration} onChange={(e) => setDuration(e.target.value)}/></div></div><label>Tema</label><Select value={mood} onValueChange={(value) => value && setMood(value)}><SelectTrigger aria-label="Tema seç"><SelectValue placeholder="Tema seç"/></SelectTrigger><SelectContent>{moods.filter((item) => item !== "All").map((item) => <SelectItem key={item} value={item}>{moodLabel(item)}</SelectItem>)}</SelectContent></Select><div className="form-row"><div><label>Bütçe</label><Select value={budget} onValueChange={(value) => value && setBudget(value)}><SelectTrigger aria-label="Bütçe seç"><SelectValue/></SelectTrigger><SelectContent>{["Free", "Low", "Flexible"].map((value) => <SelectItem key={value} value={value}>{budgetLabel(value)}</SelectItem>)}</SelectContent></Select></div><div><label>Hava koşulları</label><Select value={weather} onValueChange={(value) => value && setWeather(value)}><SelectTrigger aria-label="Uygun hava koşulunu seç"><SelectValue/></SelectTrigger><SelectContent>{["Any", "Rain-friendly", "Dry day"].map((value) => <SelectItem key={value} value={value}>{weatherLabel(value)}</SelectItem>)}</SelectContent></Select></div></div><label className="solo-check"><input type="checkbox" checked={soloFriendly} onChange={(event) => setSoloFriendly(event.target.checked)}/> Tek başına gezmeye uygun</label></div>
    <div className="form-section"><span className="section-step">02 / DURAKLAR</span><p className="form-help">Durak eklemek için haritaya tıkla. 2–8 durak ekleyip oklarla sıralarını düzenle.</p><div className="picked-point"><MapPin size={17}/>{point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "Haritada bir nokta seç"}</div><label htmlFor="stop-name">Mekân adı</label><Input id="stop-name" maxLength={80} placeholder="Köşedeki küçük kitapçı" value={stopName} onChange={(e) => setStopName(e.target.value)}/><label htmlFor="stop-note">Burada neden durmalı?</label><Textarea id="stop-note" maxLength={280} rows={2} placeholder="Fark etmeye değer bir ayrıntı…" value={stopNote} onChange={(e) => setStopNote(e.target.value)}/><div className="form-row"><div><label htmlFor="stop-minutes">Burada geçirilecek süre (dakika)</label><Input id="stop-minutes" type="number" min={5} max={180} value={stopMinutes} onChange={(e) => setStopMinutes(e.target.value)}/></div></div><label htmlFor="stop-url">Resmî site / ziyaret bilgisi (isteğe bağlı)</label><Input id="stop-url" type="url" maxLength={300} placeholder="https://..." value={stopUrl} onChange={(e) => setStopUrl(e.target.value)}/><Button className="add-stop" variant="outline" type="button" onClick={addStop} disabled={stops.length >= 8}><Plus size={17}/> Durak ekle</Button>
      <ol className="draft-stops">{stops.map((stop,index) => <li key={stop.id}><span>{String(index+1).padStart(2,"0")}</span><strong>{stop.name}</strong><div><button type="button" onClick={() => moveStop(index,-1)} disabled={index===0} aria-label={`${stop.name} durağını yukarı taşı`}><ArrowUp size={16}/></button><button type="button" onClick={() => moveStop(index,1)} disabled={index===stops.length-1} aria-label={`${stop.name} durağını aşağı taşı`}><ArrowDown size={16}/></button><button type="button" onClick={() => setStops(stops.filter((_,i)=>i!==index).map((item,position)=>({...item,position})))} aria-label={`${stop.name} durağını kaldır`}><Trash2 size={16}/></button></div></li>)}</ol>
    </div>{error && <p className="form-error" role="alert">{error}</p>}<Button className="publish-button" type="submit" disabled={busy}>{busy ? "Yayımlanıyor…" : "Rotayı yayımla"}</Button></section><div className="create-map-panel"><div className="map-panel-heading"><div><span className="eyebrow">DURAKLARINI YERLEŞTİR</span><strong>{stops.length} / 8 durak</strong></div></div><RouteMap stops={point ? [...stops,{id:"draft",position:stops.length,name:"Yeni durak",note:"",...point}] : stops} onPick={setPoint} className="create-map"/><p>Haritada bir noktaya tıkla; ardından soldaki alanda durağını adlandır.</p></div></form>
  </main>;
}
