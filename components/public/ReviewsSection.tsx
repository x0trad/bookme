"use client";
import { useState, useTransition } from "react";
import { Review } from "@/types";
import { submitReview } from "@/app/u/[username]/actions";
import { Star, Quote, CheckCircle2, ArrowRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  reviews: Review[];
  freelancerId: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            size={onChange ? 24 : 14}
            fill={active >= n ? "var(--accent)" : "transparent"}
            style={{ color: active >= n ? "var(--accent)" : "var(--border)" }}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews, freelancerId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<"lookup" | "write">("lookup");
  const [bookingId, setBookingId] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  function reset() {
    setShowForm(false);
    setStep("lookup");
    setBookingEmail("");
    setName("");
    setEmail("");
    setComment("");
    setRating(5);
    setError("");
    setLookupError("");
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError("");
    const supabase = createClient();
    const { data } = await supabase
      .from("booking_requests")
      .select("id, status")
      .eq("freelancer_id", freelancerId)
      .eq("client_email", bookingEmail.trim())
      .eq("status", "approved")
      .limit(1)
      .single();

    if (!data) {
      setLookupError("No approved booking found for that email.");
      return;
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", data.id)
      .single();

    if (existing) {
      setLookupError("A review was already submitted for this booking.");
      return;
    }

    setBookingId(data.id);
    setEmail(bookingEmail);
    setStep("write");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitReview({
        bookingId,
        freelancerId,
        reviewerName: name.trim(),
        reviewerEmail: email.trim(),
        rating,
        comment: comment.trim(),
      });
      if (res?.error) { setError(res.error); return; }
      setSuccess(true);
      setTimeout(reset, 3000);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Reviews
          </p>
          {avgRating !== null ? (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(avgRating)} />
              <span className="font-black text-lg" style={{ color: "var(--text)" }}>{avgRating.toFixed(1)}</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>No reviews yet</p>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "var(--bg-muted)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            + Write review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div
          className="rounded-3xl overflow-hidden mb-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Form header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="font-black text-sm" style={{ color: "var(--text)" }}>
              {step === "lookup" ? "Verify your booking" : "Share your experience"}
            </p>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
              <X size={15} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          <div className="px-5 py-5">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--accent-light)" }}
                >
                  <CheckCircle2 size={28} style={{ color: "var(--accent)" }} />
                </div>
                <p className="font-black text-base" style={{ color: "var(--text)" }}>Thank you!</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your review has been published.</p>
              </div>
            ) : step === "lookup" ? (
              <form onSubmit={handleLookup} className="flex flex-col gap-4">
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Enter the email you used when booking to verify your session.
                </p>
                <input
                  required
                  type="email"
                  value={bookingEmail}
                  onChange={(e) => setBookingEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-base"
                />
                {lookupError && (
                  <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{lookupError}</p>
                )}
                <button type="submit" className="btn-primary w-full">
                  Verify booking <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Star picker */}
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: "var(--text-muted)" }}>
                    Your rating
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Your name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Review
                  </label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What was your experience like?"
                    className="input-base resize-none h-28"
                  />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

                <button type="submit" disabled={pending} className="btn-primary w-full">
                  {pending ? "Publishing…" : "Publish review"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-5 relative"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {/* Quote icon */}
              <Quote
                size={32}
                className="absolute top-4 right-4 opacity-5"
                style={{ color: "var(--accent)" }}
              />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar letter */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {r.reviewer_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{r.reviewer_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRating value={r.rating} />
              </div>

              {r.comment && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
