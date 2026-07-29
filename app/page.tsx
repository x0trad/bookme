import Link from "next/link";
import {
  Zap, Calendar, Star, Shield, ArrowRight,
  Clock, Users, CheckCircle2, Share2,
} from "lucide-react";

const features = [
  {
    icon: <Share2 size={18} />,
    title: "One link. That's all.",
    desc: "Share it on Instagram, drop it in your WhatsApp bio, text it to a friend. Your booking page is live the moment you sign up.",
  },
  {
    icon: <Calendar size={18} />,
    title: "You control your time",
    desc: "Set the days and hours you're free each week. Clients only see slots that are actually open — no confusion, no double-booking.",
  },
  {
    icon: <Clock size={18} />,
    title: "Sessions as long as you want",
    desc: "One hour, two hours, a full afternoon. Clients pick what they need and only valid slots show up. Smart filtering, no setup required.",
  },
  {
    icon: <Star size={18} />,
    title: "Let your work speak",
    desc: "After every session, clients can leave a review. The more you do, the more your reputation grows — right there on your page.",
  },
  {
    icon: <Shield size={18} />,
    title: "No hoops for your clients",
    desc: "They don't need an account. They don't need an app. Just a name, an email, and a few taps. That's it.",
  },
  {
    icon: <Users size={18} />,
    title: "Every request, in one place",
    desc: "Approve or decline bookings from a clean dashboard. No spreadsheets, no back-and-forth messages — just clarity.",
  },
];

const steps = [
  {
    n: "01",
    title: "Tell people what you're good at",
    desc: "Write a short bio, list your skills, and describe what a session with you actually looks like.",
  },
  {
    n: "02",
    title: "Set your hours and your price",
    desc: "Choose when you're free and what you charge. You decide — always.",
  },
  {
    n: "03",
    title: "Share your link and breathe",
    desc: "Drop bookme.app/u/yourname anywhere. People find you, pick a time, and book. Done.",
  },
];

const skills = [
  "Music", "Fitness", "Coding", "Photography", "Cooking",
  "Trading", "Languages", "Design", "Writing", "Mentoring",
];

export default function LandingPage() {
  return (
    <div className="bg-page min-h-dvh" style={{ color: "var(--text)" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-base backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-[15px]">
            <span className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-sm">
              <Zap size={14} className="text-white" fill="white" />
            </span>
            BookMe
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/u/demo"
              className="hidden sm:inline text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              See demo
            </Link>
            <Link href="/login" className="btn-primary !py-2 !px-4 text-sm">
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mesh-bg overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex items-start gap-16 flex-wrap lg:flex-nowrap">

            {/* Left: copy */}
            <div className="flex-1 min-w-[320px]">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-6"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-brand" />
                For anyone with a skill to share
              </div>

              <h1 className="font-black leading-[1.05] tracking-tight text-[2.5rem] sm:text-[3.2rem] lg:text-[3.75rem] mb-6">
                You&apos;re good at
                <br />
                something. <span className="text-gradient">Someone</span>
                <br />
                <span className="text-gradient">needs exactly that.</span>
              </h1>

              <p
                className="text-base sm:text-lg leading-relaxed max-w-[480px] mb-9"
                style={{ color: "var(--text-muted)" }}
              >
                Not everyone wants to build a company. Some people just want to
                share what they know, on their own time, with people who genuinely
                want to learn. BookMe makes that ridiculously simple.
              </p>

              <div className="flex items-center gap-3 flex-wrap mb-9">
                <Link href="/login" className="btn-primary text-[15px] !px-7 !py-3.5">
                  Start sharing what you know <ArrowRight size={16} />
                </Link>
                <Link href="/u/demo" className="btn-ghost text-[15px] !px-7 !py-3.5">
                  See a demo profile
                </Link>
              </div>

              <div className="flex gap-6 flex-wrap">
                {[
                  "Free for solo providers",
                  "Clients book in under a minute",
                  "Works on any device",
                ].map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
                    <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: booking UI mockup */}
            <div className="flex-shrink-0 w-full lg:w-[380px] animate-float">
              <div className="card-glass overflow-hidden">
                {/* Profile header */}
                <div className="bg-gradient-brand px-6 pt-7 pb-5 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 0%, white, transparent 60%)" }} />
                  <div className="relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background: "rgba(255,255,255,0.22)" }}>
                    🎸
                  </div>
                  <p className="relative text-white font-bold text-base">Alex Rivera</p>
                  <p className="relative text-white/75 text-xs mt-1">Guitar · Music Theory · Songwriting</p>
                </div>

                {/* Body */}
                <div className="px-6 pt-5 pb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>
                    Pick a slot
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {["9:00 AM", "11:00 AM", "2:00 PM", "3:30 PM", "5:00 PM", "6:30 PM"].map((t, i) => (
                      <div
                        key={t}
                        className="rounded-lg py-2 px-1 text-center text-xs font-semibold"
                        style={
                          i === 2
                            ? { background: "var(--accent-gradient)", color: "white" }
                            : { background: "var(--bg-muted)", color: "var(--text)", border: "1.5px solid var(--border)" }
                        }
                      >
                        {t}
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>
                    Session length
                  </p>
                  <div className="flex gap-2 mb-5">
                    {["60 min · RM40", "90 min · RM55"].map((l, i) => (
                      <div
                        key={l}
                        className="flex-1 rounded-lg py-2 px-1.5 text-center text-xs font-semibold"
                        style={
                          i === 0
                            ? { background: "var(--accent-gradient)", color: "white" }
                            : { background: "var(--bg-muted)", color: "var(--text)", border: "1.5px solid var(--border)" }
                        }
                      >
                        {l}
                      </div>
                    ))}
                  </div>

                  <div className="w-full py-3 rounded-xl text-center font-bold text-sm text-white" style={{ background: "var(--accent-gradient)" }}>
                    Book for 2:00 PM →
                  </div>

                  <div className="flex items-center justify-center gap-1 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                    <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>4.9 · 38 sessions</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Skills strip ── */}
      <div className="border-y border-base py-3.5" style={{ background: "var(--bg-muted)" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            Works for
          </span>
          {skills.map((s) => (
            <span key={s} className="text-[13px] font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14 max-w-lg">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3.5" style={{ color: "var(--text-muted)" }}>
            Features
          </p>
          <h2 className="font-black text-[2rem] sm:text-[2.6rem] leading-[1.1] tracking-tight">
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
          {features.map((f) => (
            <div key={f.title} className="card p-7 transition-shadow hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-[15px] mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-base" style={{ background: "var(--bg-muted)" }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3.5" style={{ color: "var(--text-muted)" }}>
              How it works
            </p>
            <h2 className="font-black text-[2rem] sm:text-[2.6rem] leading-[1.1] tracking-tight mb-2">
              Three steps. Genuinely.
            </h2>
            <p className="text-sm mb-14" style={{ color: "var(--text-muted)" }}>
              No tutorial. No onboarding call. No credit card.
            </p>

            <div className="flex flex-col gap-2">
              {steps.map((s, i) => (
                <div key={s.n} className="flex gap-6 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-brand text-white flex items-center justify-center font-extrabold text-xs tracking-wide shadow-md">
                      {s.n}
                    </div>
                    {i < steps.length - 1 && (
                      <span className="w-px flex-1 my-2" style={{ background: "linear-gradient(var(--border), transparent)" }} />
                    )}
                  </div>
                  <div className="pb-10 pt-1.5">
                    <h3 className="font-bold text-base mb-1.5">{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-[2rem] px-8 py-16 sm:px-16 sm:py-20 relative overflow-hidden text-center" style={{ background: "var(--accent-gradient)" }}>
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 15% 20%, white, transparent 45%), radial-gradient(circle at 85% 85%, white, transparent 40%)" }} />
          <h2 className="relative font-black text-white text-[2rem] sm:text-[3rem] leading-[1.05] tracking-tight mb-5">
            Ready to open your door?
          </h2>
          <p className="relative text-white/85 text-base sm:text-lg leading-relaxed mb-9 max-w-md mx-auto">
            One link. One page. Everything someone needs to book time with you.
          </p>
          <Link
            href="/login"
            className="relative inline-flex items-center gap-2 bg-white rounded-full px-8 py-4 font-bold text-[15px] transition-transform hover:-translate-y-0.5"
            style={{ color: "var(--accent)" }}
          >
            Create your free page <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-base py-8 text-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} BookMe · Built for people who know things
        </p>
      </footer>
    </div>
  );
}
