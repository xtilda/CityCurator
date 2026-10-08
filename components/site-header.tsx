"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Compass, Menu, X } from "lucide-react";
const links = [
  { href: "/", label: "Etkinlikler" },
  { href: "/calendar", label: "Takvim" },
  { href: "/walks", label: "Şehir rotaları" },
  { href: "/my-routes", label: "Rotalarım" },
  { href: "/saved", label: "Kaydedilenler" },
  { href: "/planner", label: "Günümü planla" },
];
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="City Curator ana sayfa"><span className="brand-symbol"><Compass size={22} strokeWidth={1.6}/></span><span className="brand-copy"><span>CITY <i>CURATOR</i></span><small>İstanbul · kültür & keşif</small></span></Link>
    <button type="button" className="nav-toggle" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}<span>Menü</span></button>
    <nav id="main-navigation" aria-label="Ana menü" className={`site-nav ${open ? "is-open" : ""}`}>
      {links.map(({ href, label }) => {
        const active = pathname === href || (href === "/" && pathname?.startsWith("/events/")) || (href === "/walks" && (pathname?.startsWith("/routes/") || pathname === "/create"));
        return <a key={href} href={href} className={`${active ? "nav-active" : ""} ${href === "/planner" ? "nav-plan" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>;
      })}
    </nav>
  </header>;
}
