"use client";

import { useLanguage } from "@/lib/i18n";

export function MobileSetupCard({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 text-stone-950 sm:px-8">
      <section className="surface-card relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] p-8 shadow-2xl shadow-amber-950/10">
        <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-16 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="relative rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-stone-100 p-8 shadow-inner shadow-white/60">
          <button aria-label={language === "sv" ? "Gå tillbaka och välj skärmtyp" : "Go back and choose screen type"} className="pressable absolute left-3 top-3 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/75 px-3 text-xs font-bold text-stone-700 shadow-sm backdrop-blur-sm" onClick={onBack} type="button">
            <span aria-hidden="true">←</span>
            <span className="ml-1.5">{language === "sv" ? "Tillbaka" : "Back"}</span>
          </button>
          <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-300" />
          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-stone-950 md:text-6xl">{language === "sv" ? "Mobilvy" : "Mobile view"}</h1>
          <p className="mt-4 max-w-xl text-xl font-bold leading-8 text-stone-600">{language === "sv" ? "Den här enheten används som mobilvy för HomeBoard. Här kan du se hemmet, uppgifter och inställningar från telefonen." : "This device is used as the mobile view for HomeBoard. From here you can view your home, tasks, and settings on your phone."}</p>
          <p className="mt-3 text-sm font-semibold text-stone-600">{language === "sv" ? "Valde du fel? Gå tillbaka och välj väggskärm istället." : "Picked the wrong one? Go back and choose wall screen instead."}</p>
        </div>
      </section>
    </main>
  );
}
