import {getEventFeed} from '@/lib/events/feed';
import {getEventMedia} from '@/lib/events/detail';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;if(id.length>500)return Response.json({error:'Geçersiz etkinlik.'},{status:400});
  const feed=await getEventFeed();const event=feed.events.find(e=>e.id===id);
  if(!event)return Response.json({error:'Bu etkinlik güncel programda bulunamadı.'},{status:404});
  const media=await getEventMedia(event).catch(()=>({imageUrl:null,summary:null,checkedAt:null,unavailable:true}));
  return Response.json({event,media,source:feed.sources?.find(s=>s.id===event.sourceId)??null},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Etkinlik bilgileri yüklenemedi.'},{status:503});}
}
