import Link from "next/link";

const routes = [
  { href: "/wall", title: "Wall dashboard", description: "Landscape family hub for today’s schedule and touch-friendly task completion." },
  { href: "/app", title: "Mobile app", description: "Phone-first task management, add-task flow, filters, and calendar preview." },
  { href: "/settings", title: "Settings", description: "Household, members, calendar sources, integrations, API tokens, and backend status." },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-10">
      <section className="rounded-[3rem] border border-white/70 bg-white/65 p-8 shadow-[0_30px_100px_rgba(73,48,25,0.14)] backdrop-blur md:p-12">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-700">Self-hostable family dashboard</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-stone-950 md:text-7xl">HomeBoard keeps the whole household in sync.</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-stone-600">
              A premium-feeling wall calendar and shared task dashboard built with Next.js, local preview persistence, and clean seams for Supabase/Postgres, Home Assistant, and RUNAI later.
            </p>
          </div>
          <div className="rounded-[2rem] bg-stone-950 p-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">Preview status</p>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-white/80">
              <li>✓ LocalStorage task state for the UI</li>
              <li>✓ Mock read-only calendar source</li>
              <li>✓ API route foundation for task clients</li>
              <li>✓ No secrets or env vars required</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {routes.map((route) => (
            <Link className="rounded-[2rem] bg-white/80 p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl" href={route.href} key={route.href}>
              <h2 className="text-xl font-black text-stone-950">{route.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-stone-600">{route.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
