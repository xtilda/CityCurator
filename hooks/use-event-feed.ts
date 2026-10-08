'use client';
import {useEffect,useState} from 'react';import type {EventFeed} from '@/lib/events/model';
export function useEventFeed(){const [feed,setFeed]=useState<EventFeed|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 async function reload(){setLoading(true);setError('');try{const r=await fetch('/api/events',{cache:'no-store'});if(!r.ok)throw new Error();setFeed(await r.json());}catch{setError('Etkinlikler yüklenemedi. Tekrar deneyebilirsin.');}finally{setLoading(false);}}
 useEffect(()=>{void reload();},[]);return {feed,loading,error,reload};}
