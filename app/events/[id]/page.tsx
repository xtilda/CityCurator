import { SiteHeader } from '@/components/site-header';
import { EventDetail } from '@/components/event-detail';
export default async function EventPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  // Vinext page params can retain URL escapes; the detail client encodes the
  // canonical ID again for its API request. Decode once to avoid double encoding.
  let eventId=id;
  try { eventId=decodeURIComponent(id); } catch { /* Invalid escapes retain the missing-event state. */ }
  return <><SiteHeader/><EventDetail id={eventId}/></>;
}
