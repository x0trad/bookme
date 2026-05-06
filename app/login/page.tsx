"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Zap, Mail, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const redirectTo =
      `${window.location.origin}/auth/callback`;

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-dvh bg-page flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 py-4 max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </span>
          <span style={{ color: "var(--text)" }}>BookMe</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="card w-full max-w-sm p-8 animate-slide-up">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} style={{ color: "var(--accent)" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                We sent a magic link to{" "}
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {email}
                </span>
                . Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-6 text-sm font-medium"
                style={{ color: "var(--accent)" }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center mb-4">
                  <Mail size={22} style={{ color: "var(--accent)" }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
                  Sign in to BookMe
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Enter your email and we'll send a magic link. No password required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full mt-1"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending link…
                    </span>
                  ) : (
                    <>
                      Send magic link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                New here? Signing in creates your freelancer account automatically.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
