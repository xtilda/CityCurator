# Istanbul culture planner

## Sources

The shared feed currently has six independent adapters, using public pages or endpoints observed on the official pages:

- Filmekimi: reads https://filmekimi.iksv.org/tr/program, discovers its program identifier, then paginates the public programme endpoint and expands films to individual Istanbul screenings.
- IKSV theatre: reads https://tiyatro.iksv.org/tr/etkinlikler, discovers the Turkish programme identifier and uses the same public plugins2.ashx endpoint as the page.
- Fiba Salon IKSV: reads https://www.fibasaloniksv.com/tr, discovers its Turkish programme identifier and uses the page's public programme endpoint.
- IBB Kultur Istanbul: uses the WP Event Manager get_listings endpoint observed in the scripts on https://kultur.istanbul/etkinlikler/. Separates timed events from untimed date ranges. Season-wide promotion banners are excluded.
- IBB Kultur Sanat: reads its filtered public event list for the next 90 days. At implementation it returned no upcoming entries; this is a valid empty feed, not an API failure. Archived events are not relabelled as current.
- Passo: parses the public SSR homepage's featured event cards. Only date-and-time-specific Istanbul cultural entries are included; multi-city groups, sports and generic programme banners are excluded. This is a featured selection, not a full Passo catalogue or an official API partnership. No challenge, login or purchase flow is executed or bypassed.

Adapters validate expected source structure and dates. Cache rows are separate per source in PostgreSQL event_feeds. A source failure retains its previous data and does not replace other sources. Refreshes use a three-minute lease and a 30-minute failure retry delay. Successful source snapshots replace atomically; past events are hidden. Matching ticket paths or matching title/venue/time signatures are deduplicated, retaining separate screenings at other venues or times. Removed sessions are absent from the next successful snapshot; this is not labelled as a verified cancellation.

The public GET /api/events is a fixed-source refresh/read operation, not an arbitrary writer. It refreshes a source when its last successful check is over six hours old. Browser polling is not claimed to update while closed.

## Time and venue provenance

Local source times use Europe/Istanbul (+03:00). Impossible dates are rejected. Untimed exhibition ranges show no invented opening hour. The planner asks the user to choose a visit time within the published date range. The individual event calendar export omits unverified end times; daily-plan calendar exports include user-allocated durations with that distinction in the description.

The four Filmekimi cinema coordinates were verified through the official map links at https://filmekimi.iksv.org/tr/mekanlar. Additional theatre/Salon coordinates were obtained from https://tiyatro.iksv.org/tr/mekanlar. Muze Gazhane uses the map link on https://kultursanat.istanbul/mekanlarimiz/muze-gazhane. Istanbul Kitapcisi Kadikoy uses the official map link on https://www.istanbulkitapcisi.com/magazalarimiz. These links and coordinates were checked on 2026-09-29. Unverified venues remain in the agenda with their source names but are not included in automatic routes.

## Personal planning

Explore is now the homepage; the original curated walks remain at /walks. Visitors can store interests, event bookmarks, a working event selection and saved day plans in localStorage on their current browser, without login. This is labelled in the interface. It does not sync devices or replace the existing authenticated route-saving feature.

The day planner supports up to six events on the same local day. It validates user-allocated duration, published start time, active date range, venue coordinates, proximity limit, approximate walking time and a 15-minute early-arrival buffer. Cross-shore walking routes are rejected. Themes rank nearby outdoor landmarks and compatible events. Landmark visits are exterior/public-space suggestions, not claims of museum opening or admission availability. Durations and distance are approximate; Google walking directions let the visitor check the actual streets. Unfitting landmarks are explicitly reported. Saved plans are checked against the current event feed when reopened; an event removed from a healthy source requires reselection.

Walking estimates use direct distance times 1.5 at 4 km/h. The map draws the stop sequence, not a verified pedestrian path. Transit, live traffic, opening-hour APIs and ticket inventory are not implemented.

## Unattended update prerequisite

Sites get_site did not expose linked automations, and create_schedule was not available during implementation. Consequently no unattended schedule was created. Current updates happen when the site is opened. When Sites scheduling becomes available, re-read the same Site and its linked automations; verify a cloud task can call /api/events and read the saved timestamps/events back before linking a six-hour refresh. Routine refreshes must not rebuild or republish the app. Never put credentials in instructions or prompts.

## Validation performed

TypeScript and production build checks; official-source fixture checks for Passo, Kultur Istanbul and IBB; date-range and impossible-date handling; categories and verified free tags; same-day, duration, unknown-venue, cross-shore and time-conflict checks; walking-buffer checks; cross-source duplicates versus separate screenings. Live source fetch and cache persistence are checked after publishing. Browser interaction QA and authenticated legacy route-save testing have not been performed in this environment.


## Etkinlik detayları ve rota stüdyosu
- `/events/[id]` doğrudan açılabilen etkinlik sayfasıdır. Kartlar ve kayıtlı etkinlik başlıkları buraya yönlenir.
- `/api/events/[id]` yalnızca güncel resmî kaynak akışında bulunan kimlikleri kabul eder. Kaynak URL’si istemciden alınmaz.
- İçerik görseli İKSV `/i/content/` alanından veya resmî `og:image` metadatasından okunur. Logolar, site kökü ve desteklenmeyen URL’ler elenir. Görsel yüklenmezse bilgi alanı gösterilir.
- Kaynak HTML’i ve yönlendirmeleri HTTPS alan adı izin listesiyle sınırlandırılır. İçerik görselleri aynı resmî alanlarda kalır; dosyalar kopyalanmaz. Resmî kaynak linki fotoğrafın altında gösterilir.
- Medya bilgisi mevcut `event_feeds` tablosunda kaynak URL’sinin SHA-256 anahtarıyla altı saat tutulur; başarısızlık otuz dakika sonra yeniden denenir. Medya hatası temel etkinlik bilgilerini engellemez.
- Konum sadece doğrulanmış mekân kayıtlarından gelir. Bilinmeyen mekâna haritada tahmini bir işaret konmaz.
- Planlayıcı üç adımı, etkinlik detay bağlantılarını, süre/yürüyüş özetini ve açık hava mola önerilerini gösterir. “Uygun molaları ekle” mevcut zaman/yakınlık algoritmasına sığan durakları ekler; mevcut seçimleri silmez.
- Kontrol: gerçek Filmekimi/Tiyatro/Salon HTML örneklerinde içerik fotoğrafı seçimi; logo ve güvensiz URL elemesi; açıklama ayrıştırma; Kadıköy çevresindeki molaların yürüyüş ve 15 dk erken varış payına sığması; çakışan etkinliğin reddi doğrulandı. Tam tarayıcı etkileşim testi yapılmadı.


## Başlangıç ve saat aralığına göre planlama
- Planlarda `window` (başlangıç noktası kimliği, yola çıkış saati, gün bitişi, öncesi/sonrası tercihi) saklanır. Eski planlarda bu alan isteğe bağlıdır.
- Başlangıçlar mevcut doğrulanmış mekânlar ve kültür duraklarından seçilir; tahmini adres koordinatı üretilmez.
- Başlangıçtan ilk etkinliğe yürüyüş ve 15 dakika erken varış kontrol edilir. Yaka ve mesafe sınırları başlangıç için de uygulanır.
- Öncesi/arası/sonrası önerileri gerçek kaynak akışını kullanır. Saatli etkinlikler resmî saatini korur; saat belirtilmeyen ziyaretler kullanıcının gün aralığında 30 dakikalık başlangıç adaylarıyla önerilir ve önerilen ziyaret saati olarak etiketlenir.
- Mola seçimi başlangıç yürüyüşünü, aradaki yürüyüşleri ve gün bitişini hesaba katar. İlk/son bölümde en fazla dört, etkinlikler arasında en fazla iki mola yer alır. Sığmayanlar ayrı gösterilir. Boş kalan aralıklar serbest zaman olarak görünür.
- Kültür durağı listesi mevcut doğrulanmış yürüyüş koordinatlarıyla 22 noktaya genişletildi. Yeni açıklamalar dış mekân keşfi içindir; müze ve park girişleri için resmî saat kontrolü belirtilir.
- `/my-routes` cihazda kaydedilen planları harita ve saatli akışla görüntüler. Yeniden düzenleme `/planner?plan=` ile başlangıç ve saat ayarlarını da geri yükler. Güncel olmayan etkinlik içeren eski planlar görülebilir; yeniden kaydetme güncel doğrulamaya tabidir.
- Kontroller: başlangıç yürüyüşü, 15 dk varış payı, önce/sonra ayrımı, saat aralığı, yaka reddi, çakışan etkinlik reddi, saatsiz etkinlik adayları, kaydetme/yeniden hesaplama eşitliği ve eski plan uyumu doğrulandı. Tam tarayıcı etkileşim testi yapılmadı.

## Kullanım akışı iyileştirmeleri
- Keşfet’te arama/tarih/kategori ana kontroldür; kaynak, semt, ücretsiz ve kişiselleştirme ayrıntıları açılır filtre alanında bulunur. Tarih kısayolları İstanbul saatine göre bugünü ve yarını seçer. Arama semt bilgisini de tarar.
- Takvimde seçilen tarih ilk 35 tarih dışına çıksa da gün şeridinde kalır.
- Rota taslağının başlığı, mola seçimleri, başlangıç/saat/mesafe tercihleri ve düzenlenen rota kimliği `draftSettings` ile aynı cihaz koleksiyonunda saklanır. Başka günün ayarları yeni güne uygulanmaz. Eski koleksiyonlar alan olmadan çalışır. İlk yükleme tamamlanmadan varsayılanlar yazılmaz.
- Taslağı temizleme onay penceresi kullanır; kaydedilmiş planları silmez.
- Kontrol: TypeScript; ayarları serileştirme/geri yükleme, gün değişimi, geçersiz saat/sınır değerleri ve eski alan eksikliği kontrol edildi. Tam tarayıcı etkileşim testi yapılmadı.
