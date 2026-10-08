import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/500.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "City Curator — İstanbul kültür sanat planlayıcısı",
  description: "İstanbul etkinliklerini keşfet, yakın kültür duraklarını ekle ve kendi konseptli gün planını oluştur.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
