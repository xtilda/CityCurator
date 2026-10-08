import Link from "next/link";
import {SiteHeader} from '@/components/site-header';
import {Explore} from '@/components/explore';
import {sampleRoutes} from '@/lib/routes';
export default function Walks(){return <><SiteHeader/><div className="walks-intro"><Link href="/planner">Etkinliklerle gün rotası oluştur</Link><Link href="/my-routes">Oluşturduğum rotalar</Link><Link href="/create">Kendi yürüyüş rotanı paylaş</Link></div><Explore initialRoutes={sampleRoutes}/></>;}
