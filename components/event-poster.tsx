'use client';
import {useEffect,useRef,useState} from 'react';
import type {CultureEvent} from '@/lib/events/model';
const images=new Map<string,string|null>();
export function EventPoster({event}:{event:CultureEvent}){
 const ref=useRef<HTMLAnchorElement>(null);
 const [image,setImage]=useState<string|null>(images.get(event.id)??null);
 useEffect(()=>{
  if(images.has(event.id)){setImage(images.get(event.id)??null);return;}
  setImage(null);const controller=new AbortController();let started=false;
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting)||started)return;
   started=true;observer.disconnect();
   fetch('/api/events/'+encodeURIComponent(event.id),{signal:controller.signal}).then(async r=>{
    if(!r.ok)return;const detail=await r.json() as {media?:{imageUrl?:unknown}};const candidate=detail.media?.imageUrl;const url=typeof candidate==='string'&&candidate.startsWith('https://')?candidate:null;
    images.set(event.id,url);setImage(url);
   }).catch(()=>{});
  },{rootMargin:'150px'});
  if(ref.current)observer.observe(ref.current);
  return()=>{observer.disconnect();controller.abort();};
 },[event.id]);
 return <a ref={ref} className={'editorial-poster '+(image?'has-photo':'poster-type')} href={'/events/'+encodeURIComponent(event.id)} aria-label={event.title+' etkinliğini incele'}>
  {image?<img src={image} alt={event.title+' · resmî etkinlik görseli'} loading="lazy" referrerPolicy="no-referrer" onError={()=>setImage(null)}/>:<><span>{event.category}</span><strong>{event.title}</strong><small>{event.festival}</small></>}
 </a>;
}
