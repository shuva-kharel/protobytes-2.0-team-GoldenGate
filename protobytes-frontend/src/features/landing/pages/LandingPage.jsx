import { Link } from "react-router-dom";

const STEPS = [
  {
    title: "Discover",
    desc: "Search nearby items, compare borrow prices, and pick what you need fast.",
  },
  {
    title: "Verify",
    desc: "KYC and account checks help keep both borrowers and owners safer.",
  },
  {
    title: "Borrow & Chat",
    desc: "Send a borrow request and continue directly in in-app chat with product context.",
  },
];

const METRICS = [
  { label: "Verified-first workflow", value: "KYC + Email" },
  { label: "Realtime communication", value: "Chat enabled" },
  { label: "Borrow lifecycle", value: "Request to return" },
];

export default function LandingPage() {
  return (
    <div className="space-y-14 py-6 md:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-rose-200/80 bg-white/85 backdrop-blur p-8 md:p-12 shadow-sm">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-100 blur-3xl opacity-70" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-100 blur-3xl opacity-60" />

        <div className="relative max-w-3xl space-y-5">
          <p className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
            Community Borrowing Platform
          </p>

          <h1 className="text-4xl md:text-5xl font-black leading-tight text-slate-900">
            Borrow smarter,
            <span className="block brand-gradient font-display">lend safer</span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            ऐँचोपैंचो helps people lend and borrow everyday products through
            verified profiles, transparent borrow pricing, and direct in-app
            chat.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/home"
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Explore Products
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{m.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-rose-600">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
