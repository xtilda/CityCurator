import { getEventFeed } from '@/lib/events/feed';
export async function GET(){try{return Response.json(await getEventFeed(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Etkinlikler yüklenemedi.'},{status:503});}}
