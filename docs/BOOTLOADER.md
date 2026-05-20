# HomeBoard – BOOTLOADER

## Projektmål

HomeBoard ska bli en självhostbar, familjevänlig väggkalender och gemensam uppgiftstavla för hemmet.

Målet är att den ska fungera som en lugn familjeskärm på väggen, men också kunna användas från mobil. Appen ska vara enkel nog för vanliga familjer att sätta upp, men tekniskt tydlig nog för att kunna släppas som open source på GitHub.

HomeBoard ska kunna köras lokalt utan konto, men också kunna aktivera molnsynk för hushåll som vill synka mellan väggskärm, mobil och flera enheter.

## Produktprinciper

HomeBoard ska kännas trygg, tydlig och svår att råka förstöra.

Local-only ska aldrig kräva login. Molnsynk, mobilsynk, vuxen/admin-åtgärder och väggskärmsparning ska kräva vuxeninloggning där det behövs.

Inga hushåll ska kunna råka raderas eller glömmas som bieffekt av att användaren byter läge. Att glömma eller koppla bort ett hem på enheten ska vara en tydlig och bekräftad åtgärd. Det ska alltid framgå om åtgärden bara påverkar den här enheten eller om den påverkar hemmet i molnet.

UI-copy ska använda familjevänliga ord som “Moln”, “Molnsynk”, “Hem”, “Den här enheten”, “Endast på den här enheten”, “Väggskärm”, “Mobil” och “Vuxenåtkomst”. Användaren ska inte behöva förstå Supabase, UUID, RLS, device id eller backend-detaljer för att kunna använda HomeBoard.

En bra tumregel: om en normal svärmor inte förstår Settings-fliken utan teknisk förklaring är fliken inte klar.

## Repo-/Codex-regler

Codex ska alltid följa repots befintliga design- och kodregler.

Innan visuella ändringar ska Codex läsa relevanta projektfiler, särskilt:

- `docs/DESIGN_SYSTEM.md`
- README
- befintliga komponenter i samma område
- relevanta hooks/services/repositories

Codex ska inte införa mock-flöden i produktion. Mock/testdata får bara vara dev-only eller tydligt isolerat.

Codex ska hålla PR:er smala. Settings-UX, auth/cloud-setup, device/pairing, calendar-provider work och RLS/security ska inte blandas i samma PR om det går att undvika.

När ändringar rör visuell UX ska Codex beskriva vad ändringen bör se ut som om browser/visual tooling inte finns.

## Nuvarande status

HomeBoard har nu en fungerande produktpreview med:

- `/` som per-device startval/chooser.
- `/wall` som vägg-/surfplattevy för familjens schema, uppgifter och status.
- `/app` som mobilanpassad HomeBoard-yta.
- `/settings` som vuxen/admin-yta för språk, enhet, moln/hem, medlemmar, devices, kalender och integrationer.
- lokal lagring för local-only-läge.
- Supabase-stöd för molnhem, hushåll, medlemmar, uppgifter, kalendergrund och devices när miljövariabler finns.
- vuxen/förälder-login via e-post OTP.
- QR-/kodbaserad pairing för att koppla väggskärm eller mobil till hem.
- device-mode för `wall`, `mobile` och `admin`.
- admin/vuxenvy som vuxet HomeBoard-läge i `/app`, där Settings öppnas som verktygslåda.
- väggskärmar som inte längre ska behålla local adult auth.
- local-only parent signout för väggflöden, så telefonen som godkänner pairing inte loggas ut globalt.
- wall-side validation som gör att en väggskärm reset:ar lokalt om den tas bort/unlinkas från hemmet i molnet.

## Viktiga senaste beslut

Vuxenvy är inte samma sak som Settings.

- `admin` / vuxenvy betyder vuxet HomeBoard-läge.
- `admin` ska landa i `/app`.
- Settings är verktygslådan man öppnar från vuxenvyn.

Väggskärm ska inte ha adult access bara för att den är kopplad till ett hem.

- Adult access är fortfarande user/session-baserad.
- Pairing ska koppla device till household, inte ge adult access.
- När en browser blir väggskärm ska local parent auth rensas med local-only signout.
- Telefonen som godkänner QR/kod ska inte loggas ut.

Mobilen kan inte rensa localStorage på väggskärmen direkt.

- När en device tas bort från mobilen unlinkas den i molnet.
- Väggskärmen måste själv upptäcka att den blivit unlinked och reset:a lokalt.
- Detta ska ske via device validation på wall-sidan.

## Känd teknisk skuld / kvar att vaka på

Pairing-copy ska alltid matcha device mode.

- QR från `/wall?setup=1` ska säga “Koppla väggskärm”.
- QR från `/app?setup=1` ska säga “Koppla mobil”.
- Okänt device mode ska falla tillbaka till “Koppla enhet”, inte wall-copy.

Wall reset efter unlink ska verifieras manuellt.

- Ta bort en väggskärm från mobilen.
- Väggskärmen ska inom kort återgå till chooser/setup.
- Mobilen ska vara fortsatt inloggad.

Local reset ska alltid vara device-local.

- Ingen vägg-cleanup får använda global Supabase signout.
- Använd local-only parent signout för wall cleanup.

## Nästa rekommenderade PR

Nästa PR bör vara:

`feat/settings-collapsible-sections`

Mål:

Rensa Settings-menyn/vuxenmenyn så den blir begriplig för en vanlig familj. Den är just nu för grötig och teknisk. Inställningar ska grupperas i tydliga, collapsible pills/sektioner med familjevänlig copy.

Settings ska kännas som:

“Jag väljer vad jag vill ändra: moln, hem, den här enheten, kalender, väggskärm eller integrationer.”

Inte:

“Här är alla tekniska cards i samma långa lista.”

## Rekommenderad Settings-struktur

Settings bör byggas om till collapsible pills/sections. Förslag:

### Den här enheten

Syfte: allt som bara påverkar den device/browser användaren sitter på.

Innehåll:

- språk
- startvy / device mode
- vägg/mobil/admin-status för den här enheten
- glöm/reset:a den här enheten lokalt
- eventuell lokal lagringsstatus

Copy ska vara tydlig med “på den här enheten”.

### Moln & synk

Syfte: allt som handlar om cloud connection och sync-status.

Innehåll:

- nuvarande läge: lokalt / moln
- cloud health/status
- om molnet är konfigurerat
- om enheten är kopplad till ett hem
- aktivera molnsynk
- fortsätt lokalt
- koppla bort/glöm molnhem på den här enheten
- tydlig confirm-copy som säger att hemmet inte raderas i molnet

Denna sektion ska inte kännas som backenddiagnostik. Den ska kännas som “är mitt hem synkat eller bara på den här enheten?”.

### Hem

Syfte: allt som hör till hushållet/familjen.

Innehåll:

- valt hem / hemnamn
- medlemmar
- devices/enheter i hemmet
- lägg till/koppla väggskärm
- koppla mobil
- ta bort/unlinka en device från hemmet

Här hör DevicesSettings och MembersSettings hemma. Det ska vara tydligt att borttagning av device från hemmet inte raderar själva hemmet.

### Kalender

Syfte: allt som handlar om kalenderkällor.

Innehåll:

- kalenderkällor
- status för kalenderanslutning
- ICS/link-provider där det finns
- tydlig copy om vad som är planerat/inte implementerat ännu

### Väggskärm

Syfte: inställningar specifika för vad väggen får visa/göra.

Innehåll:

- wall task creator mode
- kiosk/display-relaterad copy om sådant finns
- eventuell framtida sovschema/ljusstyrka/default route

Det som bara påverkar väggen ska inte blandas med moln och hem.

### Integrationer

Syfte: framtida externa integrationer.

Innehåll:

- Home Assistant
- RUNAI/API tokens
- kommande API/audit/OpenAPI

Detta får gärna vara längst ner och tydligt märkt som planerat/avancerat.

### Tekniskt / Avancerat

Syfte: teknisk debug/status som inte behövs för normal användare.

Innehåll:

- repository mode
- API task state
- debug/info som bara är relevant under utveckling

Denna sektion bör vara kollapsad som default, eller bara visas i dev/debug-läge om möjligt.

## Settings UX-regler

- Default ska inte visa allt på en gång.
- Använd collapsible pills/sections med tydliga rubriker och kort status i pillen.
- Varje sektion ska ha en kort mänsklig förklaring.
- Farliga actions ska ligga nära relevant kontext och kräva confirm.
- Undvik Supabase/UUID/backend-ord i UI-copy.
- Använd “den här enheten” när åtgärden bara påverkar local device/browser.
- Använd “hemmet i molnet” när åtgärden påverkar household/cloud.
- Settings ska fungera bra på mobil först.
- Vuxen/admin ska kunna förstå vad som är lokalt, vad som är moln och vad som är hem.

## Framtida steg efter Settings cleanup

Efter Settings cleanup bör projektet gå vidare mot:

1. RLS/security för Supabase innan publik multi-household-produktion.
2. Device-token eller edge-function-modell för väggskärmar.
3. Full adult/admin-läge eller PIN/device-level access.
4. Kalender-provider integrationer.
5. Mobilvänligt cloud onboarding-flöde med mindre friktion.
6. README/docs för open source setup.
7. GitHub-releasevänlig polish.

## Mental modell

HomeBoard ska inte kännas som en teknisk demo.

Det ska kännas som:

“Jag sätter upp en familjetavla. Den funkar direkt lokalt. När jag vill kan jag slå på molnsynk och få mobilen/väggskärmen att dela samma hem. Om jag ångrar något är det tydligt vad som händer, och inget viktigt försvinner av misstag.”

Nästa UX-mål är att Settings ska vara så tydlig att en icke-teknisk familjemedlem kan förstå den utan guidning.