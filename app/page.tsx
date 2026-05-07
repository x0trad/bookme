import Link from "next/link";
import {
  Zap, Calendar, Star, Shield, ArrowRight,
  Clock, Users, CheckCircle2, Share2
} from "lucide-react";

const features = [
  {
    icon: <Share2 size={20} />,
    title: "One link. That's all.",
    desc: "Share it on Instagram, drop it in your WhatsApp bio, text it to a friend. Your booking page is live the moment you sign up.",
  },
  {
    icon: <Calendar size={20} />,
    title: "You control your time",
    desc: "Set the days and hours you're free each week. Clients only see slots that are actually open — no confusion, no double-booking.",
  },
  {
    icon: <Clock size={20} />,
    title: "Sessions as long as you want",
    desc: "One hour, two hours, a full afternoon. Clients pick what they need and only valid slots show up. Smart filtering, no setup required.",
  },
  {
    icon: <Star size={20} />,
    title: "Let your work speak",
    desc: "After every session, clients can leave a review. The more you do, the more your reputation grows — right there on your page.",
  },
  {
    icon: <Shield size={20} />,
    title: "No hoops for your clients",
    desc: "They don't need an account. They don't need an app. Just a name, an email, and a few taps. That's it.",
  },
  {
    icon: <Users size={20} />,
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

const CREAM = "#f8f7ff";
const CREAM_DARK = "#f1f0f8";
const BORDER = "#e4e2f0";
const INK = "#0f0e17";
const INK_MUTED = "#6b6880";
const WARM_MID = "#9391a8";
const ACCENT_WARM = "#7c3aed";

export default function LandingPage() {
  return (
    <div style={{ background: CREAM, minHeight: "100dvh", color: INK }}>

      {/* ── Navbar ── */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: CREAM }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: INK }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: ACCENT_WARM, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} style={{ color: "#fff" }} />
            </span>
            BookMe
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link
              href="/u/demo"
              style={{ fontSize: 14, fontWeight: 500, color: INK_MUTED, textDecoration: "none" }}
            >
              See demo
            </Link>
            <Link
              href="/login"
              style={{
                background: ACCENT_WARM, color: "#fff",
                borderRadius: 999, padding: "9px 20px",
                fontWeight: 700, fontSize: 14,
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              Get started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 28px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 56, flexWrap: "wrap" }}>

          {/* Left: copy */}
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>

            {/* Label */}
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.12em", color: WARM_MID, marginBottom: 18,
            }}>
              For anyone with a skill to share
            </p>

            {/* Headline — 30% smaller */}
            <h1 style={{
              fontFamily: "Georgia, 'Palatino Linotype', serif",
              fontSize: "clamp(1.8rem, 4.2vw, 3.3rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              color: INK,
              letterSpacing: "-0.025em",
              marginBottom: 20,
            }}>
              You&apos;re good at something.
              <br />
              <span style={{ color: ACCENT_WARM }}>Someone out there</span>
              <br />
              <span style={{ color: ACCENT_WARM }}>needs exactly that.</span>
            </h1>

            {/* Body */}
            <p style={{
              fontSize: "1rem", lineHeight: 1.7,
              color: INK_MUTED, maxWidth: 460, marginBottom: 32,
            }}>
              Not everyone wants to build a company. Some people just want to
              share what they know, on their own time, with people who genuinely
              want to learn. BookMe makes that ridiculously simple.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <Link
                href="/login"
                style={{
                  background: ACCENT_WARM, color: "#fff",
                  borderRadius: 999, padding: "13px 26px",
                  fontWeight: 700, fontSize: 14,
                  textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}
              >
                Start sharing what you know <ArrowRight size={14} />
              </Link>
              <Link
                href="/u/demo"
                style={{
                  background: "transparent", color: INK,
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 999, padding: "13px 26px",
                  fontWeight: 600, fontSize: 14,
                  textDecoration: "none",
                }}
              >
                See a demo profile
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                "Free for solo providers",
                "Clients book in under a minute",
                "Works on any device",
              ].map((s) => (
                <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: WARM_MID }}>
                  <CheckCircle2 size={12} style={{ color: ACCENT_WARM }} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Right: booking UI mockup */}
          <div style={{
            flex: "0 0 340px", borderRadius: 24,
            background: "#fff", border: `1px solid ${BORDER}`,
            boxShadow: "0 8px 40px rgba(124,58,237,0.10)",
            overflow: "hidden",
          }}>
            {/* Profile header */}
            <div style={{ background: ACCENT_WARM, padding: "28px 24px 20px", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>🎸</div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}>Alex Rivera</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>Guitar · Music Theory · Songwriting</p>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: WARM_MID, marginBottom: 10 }}>
                Pick a slot
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {["9:00 AM", "11:00 AM", "2:00 PM", "3:30 PM", "5:00 PM", "6:30 PM"].map((t, i) => (
                  <div key={t} style={{
                    padding: "8px 4px", borderRadius: 10, textAlign: "center",
                    fontSize: 12, fontWeight: 600,
                    background: i === 2 ? ACCENT_WARM : CREAM_DARK,
                    color: i === 2 ? "#fff" : INK,
                    border: `1.5px solid ${i === 2 ? ACCENT_WARM : BORDER}`,
                    cursor: "pointer",
                  }}>{t}</div>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: WARM_MID, marginBottom: 10 }}>
                Session length
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["60 min · RM40", "90 min · RM55"].map((l, i) => (
                  <div key={l} style={{
                    flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center",
                    fontSize: 12, fontWeight: 600,
                    background: i === 0 ? ACCENT_WARM : CREAM_DARK,
                    color: i === 0 ? "#fff" : INK,
                    border: `1.5px solid ${i === 0 ? ACCENT_WARM : BORDER}`,
                  }}>{l}</div>
                ))}
              </div>

              <div style={{
                width: "100%", padding: "12px 0", borderRadius: 12,
                background: ACCENT_WARM, color: "#fff",
                fontWeight: 700, fontSize: 14, textAlign: "center",
              }}>
                Book for 2:00 PM →
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 14 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
                ))}
                <span style={{ fontSize: 12, color: WARM_MID, marginLeft: 4 }}>4.9 · 38 sessions</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Skills strip ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: CREAM_DARK, padding: "14px 0", overflowX: "hidden" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", gap: 24, overflowX: "auto" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: WARM_MID, flexShrink: 0 }}>
            Works for
          </span>
          {skills.map((s) => (
            <span key={s} style={{ fontSize: 13, fontWeight: 500, color: INK_MUTED, flexShrink: 0 }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 28px" }}>
        <div style={{ marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: WARM_MID, marginBottom: 14 }}>
            Features
          </p>
          <h2 style={{
            fontFamily: "Georgia, 'Palatino Linotype', serif",
            fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
            fontWeight: 700, color: INK,
            lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: 28, borderRadius: 18,
                background: CREAM_DARK,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ marginBottom: 14, color: ACCENT_WARM }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.68, color: INK_MUTED }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: CREAM_DARK, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 28px" }}>
          <div style={{ maxWidth: 580 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: WARM_MID, marginBottom: 14 }}>
              How it works
            </p>
            <h2 style={{
              fontFamily: "Georgia, 'Palatino Linotype', serif",
              fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
              fontWeight: 700, color: INK,
              lineHeight: 1.15, letterSpacing: "-0.02em",
              marginBottom: 8,
            }}>
              Three steps. Genuinely.
            </h2>
            <p style={{ fontSize: 14, color: WARM_MID, marginBottom: 52 }}>
              No tutorial. No onboarding call. No credit card.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {steps.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 22 }}>
                  <div style={{
                    flexShrink: 0, width: 46, height: 46, borderRadius: 14,
                    background: ACCENT_WARM, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 12, letterSpacing: "0.03em",
                  }}>
                    {s.n}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: INK, marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.68, color: INK_MUTED }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 28px" }}>
        <div style={{ maxWidth: 560 }}>
          <h2 style={{
            fontFamily: "Georgia, 'Palatino Linotype', serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700, color: INK,
            lineHeight: 1.1, letterSpacing: "-0.025em",
            marginBottom: 18,
          }}>
            Ready to open your door?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.72, color: INK_MUTED, marginBottom: 36, maxWidth: 420 }}>
            One link. One page. Everything someone needs to book time with you.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: ACCENT_WARM, color: "#fff",
              borderRadius: 999, padding: "16px 34px",
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}
          >
            Create your free page <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "32px 28px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: WARM_MID }}>
          © {new Date().getFullYear()} BookMe · Built for people who know things
        </p>
      </footer>
    </div>
  );
}
