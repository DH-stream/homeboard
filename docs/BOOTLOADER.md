# HomeBoard – BOOTLOADER

## Projektmål

HomeBoard ska bli en självhostbar, familjevänlig väggkalender och gemensam uppgiftstavla för hemmet.

Målet är att den ska fungera som en “familjeskärm” på väggen, men också kunna användas från mobil. Appen ska vara enkel nog för vanliga familjer att sätta upp, men tekniskt tydlig nog för att kunna släppas som open source på GitHub.

HomeBoard ska kunna köras lokalt utan konto, men också kunna aktivera molnsynk för hushåll som vill synka mellan väggskärm, mobil och flera enheter.

## Produktprinciper

HomeBoard ska kännas trygg, tydlig och svår att råka förstöra.

Local-only ska aldrig kräva login. Molnsynk, mobilsynk, vuxen/admin-åtgärder och framtida väggskärmsparning ska kräva vuxeninloggning.

Inga hushåll ska kunna råka raderas eller glömmas som bieffekt av att användaren byter läge. Att “glömma molnhem på den här enheten” ska endast finnas som en explicit Settings-action med tydlig confirm-ruta. Det ska också framgå att detta inte raderar hushållet i molnet.

UI-copy ska använda familjevänliga ord som “Moln”, “Molnsynk”, “Hem”, “Endast på den här enheten” och “Vuxenåtkomst”. Användaren ska inte behöva förstå Supabase, UUID eller backend-detaljer.

## Repo-/Codex-regler

Codex ska alltid följa repots befintliga design- och kodregler.

Innan visuella ändringar ska Codex läsa relevanta projektfiler, särskilt:

- `docs/DESIGN_SYSTEM.md`
- README
- befintliga komponenter i samma område
- relevanta hooks/services/repositories

Codex ska inte införa mock-flöden i produktion. Mock/testdata får bara vara dev-only eller tydligt isolerat.

Codex ska hålla PR:er smala. Wall-readability, auth/cloud-setup, settings-hardening, calendar-provider work och RLS/security ska inte blandas i samma PR om det går att undvika.

När ändringar rör visuell UX ska Codex beskriva vad ändringen bör se ut som om browser/visual tooling inte finns.

## Nuvarande status

PR #19 är mergad och förbättrade wall-vyn:

- tasks filtreras via medlems-pills
- ingen “All people”
- ingen gruppering per medlem
- smart taskkolumn-layout
- WeekPreview är måndag–söndag
- vecka byts via drag/swipe
- vecka har stabil höjd
- dag kan öppna tydlig overlay-ruta
- klick utanför stänger overlay
- upp till 4 events visas i snabbvyn

PR #20 är mergad och lade grunden för accessmodellen:

- vuxen/förälder-login via e-post OTP
- local-only kräver inte login
- molnhem kräver vuxenlogin
- hushåll kan kopplas till `owner_user_id`
- första vuxna medlemmen kan kopplas till `user_id`
- local-only raderar inte valt molnhem
- helper finns för framtida explicit “glöm molnhem på den här enheten”

## Viktig nuvarande lucka

Det saknas fortfarande ett bulletproof Settings-flöde för Cloud & Sync.

Efter att användaren valt local-only måste det finnas en tydlig väg i Settings för att aktivera molnsynk i efterhand.

Det ska finnas en Settings-yta som visar:

- nuvarande läge: Lokalt / Moln
- om molnet är konfigurerat
- vilket hem som är valt
- om local-only är aktivt
- knapp för “Aktivera molnsynk”
- vuxenlogin om det behövs
- skapa eller välj molnhem
- tydlig knapp för “Fortsätt lokalt”
- farlig men trygg action: “Glöm molnhem på den här enheten”
- confirm-ruta som förklarar att hushållet inte raderas i molnet

## Nästa rekommenderade PR

Skapa en PR ungefär:

`feat/cloud-sync-settings-hardening`

Mål:

- Bygg vidare på `CloudStatusSettings`
- Visa local-only vs cloud-status tydligt
- Lägg till “Aktivera molnsynk” från Settings
- Lägg till “Glöm molnhem på den här enheten” bakom confirm
- Se till att användaren aldrig behöver console/localStorage för vanliga flöden
- Se till att inget hushåll kan rensas av misstag
- Håll Supabase-ord borta från användar-UI

## Framtida steg efter Settings-hardening

Efter Cloud & Sync Settings bör projektet gå vidare mot:

1. Väggskärmsparning med kod/QR-liknande flöde
2. RLS/security för Supabase
3. Device-token eller edge-function-modell för väggskärmar
4. Full adult/admin-läge eller PIN
5. Kalender-provider integrationer
6. Mobilvänligt molnsynk-flöde
7. README/docs för open source setup
8. GitHub-releasevänlig polish

## Mental modell

HomeBoard ska inte kännas som en teknisk demo.

Det ska kännas som:

“Jag sätter upp en familjetavla. Den funkar direkt lokalt. När jag vill kan jag slå på molnsynk och få mobilen/väggskärmen att dela samma hem. Om jag ångrar något är det tydligt vad som händer, och inget viktigt försvinner av misstag.”
