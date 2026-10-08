'use client';
import { useEffect,useRef,useState } from 'react';
import type { Category,CultureEvent } from '@/lib/events/model';
import type {DraftSettings} from '@/lib/events/draft-settings';
import type { DayPlan,PlannedEvent } from '@/lib/events/planner';
export type Collection={interests:Category[];theme:string;bookmarks:CultureEvent[];draft:PlannedEvent[];plans:DayPlan[];draftSettings?:DraftSettings};
const key='city-curator:collection:v1';
const empty:Collection={interests:[],theme:'mixed',bookmarks:[],draft:[],plans:[]};
function read():Collection{const s=localStorage.getItem(key);if(!s)return empty;const d=JSON.parse(s);return {...empty,...d,interests:Array.isArray(d.interests)?d.interests:[],bookmarks:Array.isArray(d.bookmarks)?d.bookmarks:[],draft:Array.isArray(d.draft)?d.draft:[],plans:Array.isArray(d.plans)?d.plans:[]};}
export function useCityCollection(){
 const [data,setData]=useState<Collection>(empty),[ready,setReady]=useState(false),[error,setError]=useState('');const ref=useRef(data);
 useEffect(()=>{const load=()=>{try{const value=read();ref.current=value;setData(value);}catch{setError('Bu tarayıcıda kayıtlar okunamadı.');}setReady(true);};load();window.addEventListener('storage',load);window.addEventListener('city-collection',load);return()=>{window.removeEventListener('storage',load);window.removeEventListener('city-collection',load);};},[]);
 function update(change:(value:Collection)=>Collection){if(!ready)return false;const value=change(ref.current);try{localStorage.setItem(key,JSON.stringify(value));ref.current=value;setData(value);setError('');window.dispatchEvent(new Event('city-collection'));return true;}catch{setError('Tarayıcı kayda izin vermedi. Değişiklik kaydedilemedi.');return false;}}
 return {data,ready,error,update};
}
