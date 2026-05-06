"use client";
import { useState, useTransition } from "react";
import { ServiceOffering } from "@/types";
import { submitBookingRequest } from "@/app/u/[username]/actions";
import { formatDateLabel, formatTime } from "@/lib/utils";
import { CheckCircle2, Calendar, Clock, DollarSign, X, ArrowRight } from "lucide-react";

interface Props {
  freelancerId: string;
  service: ServiceOffering | null;
  date: Date;
  startTime: string;
  durationHours: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingForm({ freelancerId, service, date, startTime, durationHours, onSuccess, onCancel }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const endH = Number(startTime.split(":")[0]) + durationHours;
  const endTime = `${String(Math.floor(endH)).padStart(2, "0")}:00`;
  const totalPrice = service ? service.price * durationHours : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitBookingRequest({
        freelancerId,
        serviceId: service?.id ?? null,
        clientName: name.trim(),
        clientEmail: email.trim(),
        clientMessage: message.trim(),
        bookingDate: date.toISOString().split("T")[0],
        startTime,
        durationHours,
      });
      if (res?.error) { setError(res.error); return; }
      setSuccess(true);
      setTimeout(onSuccess, 3000);
    });
  }

  if (success) {
    return (
      <div
        className="rounded-3xl p-8 text-center"
        style={{ background: "var(--bg-card)", border: "2px solid var(--accent)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, var(--accent), #c084fc)" }}
        >
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-black mb-2" style={{ color: "var(--text)" }}>You&apos;re booked!</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your request has been sent. You&apos;ll get a confirmation once it&apos;s approved.
        </p>
        <div
          className="mt-4 rounded-xl p-3 text-sm font-medium"
          style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
        >
          {formatDateLabel(date)} · {formatTime(startTime)} – {formatTime(endTime)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, var(--accent), #c084fc)" }}
      >
        <div>
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Booking Summary</p>
          <p className="text-white font-black text-base">{formatDateLabel(date)}</p>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <X size={15} className="text-white" />
        </button>
      </div>

      {/* Summary pills */}
      <div className="px-5 py-4 flex flex-wrap gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Pill icon={<Calendar size={12} />} label={formatDateLabel(date)} />
        <Pill icon={<Clock size={12} />} label={`${formatTime(startTime)} – ${formatTime(endTime)} (${durationHours}h)`} />
        {service && <Pill icon={<span className="text-[10px] font-bold">SVC</span>} label={service.title} />}
        {totalPrice !== null && (
          <Pill icon={<DollarSign size={12} />} label={`$${totalPrice.toFixed(0)} total`} accent />
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Your Details
        </p>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Full name <span className="text-red-400">*</span>
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
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Message <span className="text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me a bit about what you need…"
              className="input-base resize-none h-24"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ background: "rgba(239,68,68,0.1)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !name.trim() || !email.trim()}
          className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--accent), #c084fc)" }}
        >
          {pending ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending request…
            </>
          ) : (
            <>
              Confirm booking
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          No payment now — you&apos;ll hear back once your request is approved.
        </p>
      </form>
    </div>
  );
}

function Pill({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: accent ? "var(--accent-light)" : "var(--bg-muted)",
        color: accent ? "var(--accent)" : "var(--text-muted)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      {icon}
      {label}
    </div>
  );
}
