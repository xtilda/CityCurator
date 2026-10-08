'use client';
import Link from "next/link";
import {useEffect,useState} from 'react';
import {ArrowLeft,Bookmark,CalendarDays,Check,MapPin,Plus,Navigation} from 'lucide-react';
import {useCityCollection} from '@/hooks/use-city-collection';
import {RouteMap} from './route-map';
import {activeOn,dateLabel,isUpcoming,localDate,nearbyLandmarks,timeLabel,venueFor,type CultureEvent,type SourceStatus} from '@/lib/events/model';
import type {EventMedia} from '@/lib/events/detail';
import {exportEvents} from '@/lib/events/calendar-export';
type Detail={event:CultureEvent;media:EventMedia;source:SourceStatus|null};
export function EventDetail({id}:{id:string}){
 const {data,ready,error:storageError,update}=useCityCollection();
 const [detail,setDetail]=useState<Detail|null>(null),[error,setError]=useState(''),[missing,setMissing]=useState(false),[retry,setRetry]=useState(0),[notice,setNotice]=useState(''),[imageFailed,setImageFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();setError('');setMissing(false);setDetail(null);setImageFailed(false);
  fetch('/api/events/'+encodeURIComponent(id),{signal:controller.signal}).then(async r=>{if(r.status===404){setMissing(true);return;}if(!r.ok)throw new Error();setDetail(await r.json());}).catch(e=>{if(e.name!=='AbortError')setError('Etkinlik bilgileri yüklenemedi.');});return()=>controller.abort();},[id,retry]);
 if(!detail)return <main className="event-detail-page"><Link className="back-link" href="/"><ArrowLeft size={16}/>Etkinliklere dön</Link><div className="event-detail-empty">{missing?<><h1>Bu etkinlik artık güncel programda yok.</h1><p>Yeni tarih ve seanslar için etkinlikleri keşfedebilirsin.</p><Link href="/">Güncel etkinlikler</Link></>:error?<><h1>Etkinlik yüklenemedi.</h1><p role="alert">{error}</p><button onClick={()=>setRetry(n=>n+1)}>Tekrar dene</button></>:<p role="status">Etkinlik detayları hazırlanıyor…</p>}</div></main>;
 const {event,media,source}=detail;const venue=venueFor(event),nearby=nearbyLandmarks(event,data.theme).slice(0,3),chosen=data.draft.some(i=>i.event.id===event.id),saved=data.bookmarks.some(e=>e.id===event.id);
 function add(){if(chosen){window.location.assign('/planner');return;}if(data.draft.length>=6){setNotice('Bir günlük plana en fazla 6 etkinlik eklenebilir.');return;}const today=localDate(new Date()),date=activeOn(event,today)?today:event.startsAt.slice(0,10);const start=event.timeKnown===false?date+'T14:00:00+03:00':event.startsAt;if(update(s=>({...s,draft:[...s.draft,{event,start,duration:event.category==='Film'?120:90}]})))window.location.assign('/planner');}
 return <main className="event-detail-page">
  <Link className="back-link" href="/"><ArrowLeft size={16}/>Etkinliklere dön</Link>
  <div className="event-detail-layout"><article>
   <div className="event-detail-heading"><span className="eyebrow">{event.category} · {event.festival}</span><h1>{event.title}</h1>{event.director&&<p className="event-detail-director">Yönetmen: {event.director}</p>}</div>
   {media.imageUrl&&!imageFailed?<figure className="event-detail-photo"><img src={media.imageUrl} alt={event.title+' · resmî etkinlik görseli'} onError={()=>setImageFailed(true)} referrerPolicy="no-referrer"/><figcaption>Etkinlik görseli · <a href={event.sourceUrl} target="_blank" rel="noreferrer">{source?.name??event.festival}</a></figcaption></figure>:<div className="event-detail-visual"><CalendarDays size={38}/><span>{event.category}</span><strong>{dateLabel(event.startsAt)}</strong><small>Resmî kaynakta kullanılabilir etkinlik görseli bulunamadı.</small></div>}
   <section className="event-about"><h2>Etkinlik hakkında</h2>{media.summary&&<p>{media.summary}…</p>}<p>{event.festival} programındaki bu {event.category.toLocaleLowerCase('tr-TR')} etkinliği{venue?' '+venue.area+'’nda':''} gerçekleşiyor. Programın tamamını ve katılım koşullarını resmî sayfadan inceleyebilirsin.</p><a href={event.sourceUrl} target="_blank" rel="noreferrer">Resmî etkinlik sayfası</a></section>
   {nearby.length>0&&<section className="event-nearby"><span className="eyebrow">ETKİNLİĞİN ETRAFINDA</span><h2>Gitmişken keşfet</h2><p>Yakındaki açık hava duraklarını rota oluştururken gününe ekleyebilirsin.</p><div>{nearby.map(({stop,km})=><article key={stop.id}>{stop.photo&&<img src={stop.photo} alt={stop.name} loading="lazy"/>}<h3>{stop.name}</h3><small>Yaklaşık {km.toFixed(1)} km · 15 dk mola</small><p>{stop.tip}</p>{stop.photoCredit&&<small className="landmark-credit">Fotoğraf: <a href={stop.photoCredit.source} target="_blank" rel="noreferrer">{stop.photoCredit.name}</a> · {stop.photoCredit.license} · boyutlandırıldı</small>}</article>)}</div></section>}
  </article><aside className="event-detail-sidebar">
   <section className="event-booking"><span className="eyebrow">GÜNÜNE EKLE</span><h2>Ne zaman, nerede?</h2><div className="detail-info"><CalendarDays size={20}/><div><strong>{dateLabel(event.startsAt)}{event.endsAt?' – '+dateLabel(event.endsAt):''}</strong><p>{event.timeKnown===false?'Ziyaret saatini planında seçebilirsin.':timeLabel(event.startsAt)+' · Resmî başlangıç'}</p></div></div><div className="detail-info"><MapPin size={20}/><div><strong>{event.venueName??venue?.name??'Mekân belirtilmemiş'}</strong>{venue&&<p>{venue.area} · İstanbul</p>}</div></div>{event.free&&<span className="free-mark">Ücretsiz etkinlik</span>}
    <button className="plan-primary" disabled={!ready||!isUpcoming(event)} onClick={add}>{chosen?<Check size={18}/>:<Plus size={18}/>}{chosen?'Planımı aç':'Bu etkinlikle rota oluştur'}</button>
    <button className="event-save" disabled={!ready} aria-pressed={saved} onClick={()=>update(s=>({...s,bookmarks:saved?s.bookmarks.filter(e=>e.id!==event.id):[event,...s.bookmarks].slice(0,100)}))}><Bookmark size={17} fill={saved?'currentColor':'none'}/>{saved?'Kaydedildi':'Etkinliği kaydet'}</button>
    <div className="event-booking-links">{event.ticketUrl&&<a href={event.ticketUrl} target="_blank" rel="noreferrer">Bilet / katılım bilgisi</a>}{event.timeKnown!==false&&<button onClick={()=>exportEvents([event])}>Takvimime ekle</button>}</div>
    {(notice||storageError)&&<p role="status" className="culture-notice">{storageError||notice}</p>}
   </section>
   <section className="event-location"><h2>Konum</h2>{venue?<><RouteMap className="event-location-map" stops={[{id:venue.id,name:venue.name,note:'',position:0,lat:venue.lat,lng:venue.lng}]}/><a href={venue.mapsUrl} target="_blank" rel="noreferrer"><Navigation size={16}/>Haritada yol tarifi al</a></>:<p>Bu mekânın konumu henüz doğrulanmadı. Adresi resmî etkinlik sayfasından kontrol et.</p>}</section>
   <p className="event-source-note">Kaynak: {source?.name??event.festival}{source?.checkedAt&&<> · Son kontrol: {dateLabel(source.checkedAt)} {timeLabel(source.checkedAt)}</>}. Gitmeden önce güncel programı kontrol et.</p>
  </aside></div>
 </main>;
}
