'use client';
import {createContext,useContext,useEffect,useState,type ComponentProps} from 'react';
import type {DayButton} from 'react-day-picker';
import {tr} from 'date-fns/locale';
import {Calendar,CalendarDayButton} from '@/components/ui/calendar';
import {activeOn,localDate,type CultureEvent} from '@/lib/events/model';
const EventsContext=createContext<CultureEvent[]>([]);
function EventDayButton({day,modifiers,...props}:ComponentProps<typeof DayButton>){
 const events=useContext(EventsContext);const count=events.filter(e=>activeOn(e,localDate(day.date))).length;
 return <CalendarDayButton {...props} day={day} modifiers={modifiers} className={'event-month-day'+(count?' has-events':'')} aria-label={(props['aria-label']??localDate(day.date))+(count?`, ${count} etkinlik veya seans`: ', etkinlik yok')}><span className="month-day-number">{day.date.getDate()}</span>{count>0?<span className="month-day-count">{count}<span className="month-day-count-label"> etkinlik</span></span>:<span className="month-day-empty" aria-hidden="true">·</span>}</CalendarDayButton>;
}
const atNoon=(date:string)=>new Date(date+'T12:00:00+03:00');
export function EventMonthCalendar({date,today,events,onSelect,loading}:{date:string;today:string;events:CultureEvent[];onSelect:(date:string)=>void;loading:boolean}){
 const [month,setMonth]=useState(()=>atNoon(date));
 useEffect(()=>{setMonth(atNoon(date));},[date]);
 return <section className="event-month-panel" aria-label="Aylık etkinlik takvimi"><div className="event-month-intro"><div><span className="eyebrow">AYIN TAMAMI</span><h2>Bir gün seç, programını gör.</h2></div><button type="button" onClick={()=>{setMonth(atNoon(today));onSelect(today);}}>Bugüne dön</button></div><EventsContext.Provider value={events}><Calendar className="event-month-calendar" mode="single" required selected={atNoon(date)} onSelect={selected=>{if(selected)onSelect(localDate(selected));}} month={month} onMonthChange={setMonth} today={atNoon(today)} locale={tr} timeZone="Europe/Istanbul" weekStartsOn={1} fixedWeeks showOutsideDays labels={{labelPrevious:()=> 'Önceki ay',labelNext:()=> 'Sonraki ay'}} components={{DayButton:EventDayButton}} formatters={{formatCaption:d=>new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric',timeZone:'Europe/Istanbul'}).format(d)}}/></EventsContext.Provider><div className="event-month-legend"><span><i/>Etkinlik olan günler</span><span>Rakamlar mevcut filtrelere uyan etkinlik ve seans sayısıdır.</span>{loading&&<span role="status">Program yükleniyor…</span>}</div></section>;
}
