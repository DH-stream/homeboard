"use client";

import { useMemo, useState } from "react";
import {
  HomeBoardMascotMoment,
  type HomeBoardMascotMomentType,
} from "@/components/mascot/HomeBoardMascotMoment";

const demoTasks = [
  "Plocka undan i hallen",
  "Mata katten",
  "Packa väskan inför imorgon",
];

export default function MascotCelebrationPrototypePage() {
  const [moment, setMoment] = useState<HomeBoardMascotMomentType>("thumbsUp");
  const [runId, setRunId] = useState(0);

  const replayKey = useMemo(() => `${moment}-${runId}`, [moment, runId]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ef] px-5 py-6 text-stone-950 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-700">
              HomeBoard prototype
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight lg:text-6xl">
              Mascot celebration animation
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-semibold text-stone-600">
              Isolerad preview för koalans day-complete-moment. Fokus är
              rörelse, timing och känsla — inte final illustration ännu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-white/70 p-2 shadow-[0_18px_55px_rgba(84,59,34,0.12)] backdrop-blur">
            <button
              className={`rounded-full px-4 py-2 text-sm font-black transition ${moment === "thumbsUp" ? "bg-stone-950 text-white" : "bg-white text-stone-700"}`}
              onClick={() => {
                setMoment("thumbsUp");
                setRunId((current) => current + 1);
              }}
              type="button"
            >
              Thumbs up
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-black transition ${moment === "proudClap" ? "bg-stone-950 text-white" : "bg-white text-stone-700"}`}
              onClick={() => {
                setMoment("proudClap");
                setRunId((current) => current + 1);
              }}
              type="button"
            >
              Proud clap
            </button>
            <button
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-stone-950 shadow-[0_10px_24px_rgba(245,158,11,0.22)] transition active:scale-95"
              onClick={() => setRunId((current) => current + 1)}
              type="button"
            >
              Spela om
            </button>
          </div>
        </header>

        <section className="grid min-h-[680px] gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/78 p-5 shadow-[0_24px_80px_rgba(120,93,58,0.18)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  Tasks
                </p>
                <h2 className="text-3xl font-black">Idag</h2>
              </div>
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
                3/3 klart
              </div>
            </div>

            <div key={`tasks-${replayKey}`} className="mt-7 grid gap-4">
              {demoTasks.map((task, index) => (
                <div
                  className="animate-[prototype-task-fly-home_3900ms_var(--ease-out)_both] rounded-[1.6rem] border border-white bg-white/90 p-4 shadow-[0_12px_35px_rgba(84,59,34,0.1)]"
                  key={task}
                  style={{ animationDelay: `${820 + index * 135}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-emerald-500 text-lg font-black text-white">
                      ✓
                    </span>
                    <p className="text-xl font-black text-stone-800">{task}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-[1.8rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-5 opacity-0 shadow-[0_18px_60px_rgba(16,185,129,0.16)] animate-[prototype-calm-card-in_3900ms_var(--ease-out)_both]">
              <p className="text-2xl font-black text-emerald-800">Allt är klart för idag</p>
              <p className="mt-1 font-bold text-stone-600">
                Uppgifterna har flugit hem. Nu får kalendern ta över.
              </p>
            </div>
          </div>

          <div className="relative grid overflow-hidden rounded-[2.5rem] bg-[#fffaf0] shadow-[0_24px_80px_rgba(120,93,58,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(251,191,36,0.24),transparent_34rem),radial-gradient(circle_at_62%_72%,rgba(52,211,153,0.18),transparent_26rem)]" />
            <div className="relative grid place-items-center p-8">
              <div key={replayKey} className="grid justify-items-center gap-5">
                <HomeBoardMascotMoment moment={moment} />
                <div className="max-w-xl text-center opacity-0 animate-[prototype-copy-in_3900ms_var(--ease-out)_both]">
                  <p className="text-5xl font-black tracking-tight lg:text-7xl">
                    {moment === "thumbsUp" ? "Stjärnklart!" : "Dagens uppdrag är klart"}
                  </p>
                  <p className="mt-3 text-xl font-bold text-stone-600">
                    {moment === "thumbsUp"
                      ? "Koalan poppar in och ger en tydlig high-five-känsla."
                      : "Koalan klappar stolt och låter firandet landa mjukare."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes prototype-task-fly-home {
          0%, 18% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          38% {
            opacity: 1;
            transform: translateY(-0.35rem) scale(0.985);
          }
          58% {
            opacity: 0;
            transform: translateY(-2.4rem) scale(0.88) rotate(-1.5deg);
            filter: blur(0.4px);
          }
          100% {
            opacity: 0;
            transform: translateY(-2.4rem) scale(0.88) rotate(-1.5deg);
          }
        }

        @keyframes prototype-calm-card-in {
          0%, 54% {
            opacity: 0;
            transform: translateY(1.2rem) scale(0.96);
          }
          72%, 100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes prototype-copy-in {
          0%, 24% {
            opacity: 0;
            transform: translateY(1rem) scale(0.96);
          }
          38%, 78% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-0.35rem) scale(0.99);
          }
        }
      `}</style>
    </main>
  );
}
