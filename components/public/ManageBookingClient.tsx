"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvailabilitySlot, ManagedBooking } from "@/types";
import { cancelBooking, rescheduleBooking } from "@/app/booking/[token]/actions";
import {
  getUpcomingDates,
  generateHourlySlots,
  getBlockedSlots,
  getValidStartTimes,
  formatDateLabel,
  formatTime,
} from "@/lib/utils";
import {
  Calendar, Clock, User, CheckCircle2, XCircle, AlertTriangle,
  CalendarClock, ArrowLeft, ArrowRight,
} from "lucide-react";

const STATUS_STYLES: Record<
  ManagedBooking["status"],
  { bg: string; text: string; label: string; note: string }
> = {
  pending: {
    bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Pending",
    note: "Waiting for your freelancer to approve this request.",
  },
  approved: {
    bg: "bg-green-500/10", text: "text-green-500", label: "Confirmed",
    note: "Your session is confirmed. See you there!",
  },
  rejected: {
    bg: "bg-red-500/10", text: "text-red-500", label: "Declined",
    note: "This request was declined. You can book another time below.",
  },
  cancelled: {
    bg: "bg-gray-500/10", text: "text-gray-400", label: "Cancelled",
    note: "This booking has been cancelled.",
  },
};

interface ApprovedBooking {
  booking_date: string;
  start_time: string;
  duration_hours: number;
}

interface Props {
  token: string;
  booking: ManagedBooking;
  availability: AvailabilitySlot[];
  approvedBookings: ApprovedBooking[];
}

export function ManageBookingClient({ token, booking, availability, approvedBookings }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "reschedule" | "confirm-cancel">("view");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  const s = STATUS_STYLES[booking.status];
  const isPast = new Date(booking.booking_date + "T23:59:59") < new Date();
  const canModify = !isPast && (booking.status === "pending" || booking.status === "approved");

  const endH = Number(booking.start_time.split(":")[0]) + booking.duration_hours;
  const endTime = `${String(Math.floor(endH)).padStart(2, "0")}:00`;
  const dateLabel = new Date(booking.booking_date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const totalPrice =
    booking.service_price != null ? booking.service_price * booking.duration_hours : null;

  const upcomingDates = useMemo(() => getUpcomingDates(availability), [availability]);

  const validTimes = useMemo(() => {
    if (!selectedDate) return [];
    const dow = selectedDate.getDay();
    const daySlots = availability.filter((a) => a.day_of_week === dow);
    const allSlots = daySlots.flatMap((a) => generateHourlySlots(a.start_time, a.end_time));
    const dateStr = selectedDate.toISOString().split("T")[0];
    const blocked = getBlockedSlots(approvedBookings.filter((b) => b.booking_date === dateStr));
    return getValidStartTimes(allSlots, blocked, booking.duration_hours);
  }, [selectedDate, availability, approvedBookings, booking.duration_hours]);

  function handleCancel() {
    setError("");
    startTransition(async () => {
      const res = await cancelBooking(token);
      if (res?.error) { setError(res.error); return; }
      setMode("view");
      setNotice("Your booking has been cancelled.");
      router.refresh();
    });
  }

  function handleReschedule() {
    if (!selectedDate || !selectedTime) return;
    setError("");
    startTransition(async () => {
      const res = await rescheduleBooking({
        token,
        bookingDate: selectedDate.toISOString().split("T")[0],
        startTime: selectedTime,
        previousDate: booking.booking_date,
        previousTime: booking.start_time,
      });
      if (res?.error) { setError(res.error); return; }
      setMode("view");
      setSelectedDate(null);
      setSelectedTime(null);
      setNotice("Your booking has been moved and is waiting for re-approval.");
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto flex flex-col gap-4">
        {/* Back to profile */}
        {booking.freelancer_username && (
          <Link
            href={`/u/${booking.freelancer_username}`}
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} /> Back to {booking.freelancer_name ?? "profile"}
          </Link>
        )}

        {/* Booking card */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-black" style={{ color: "var(--text)" }}>
                Your booking
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <User size={13} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  with {booking.freelancer_name ?? booking.freelancer_username}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
              {s.label}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
              <Calendar size={15} style={{ color: "var(--text-muted)" }} />
              <span className="font-semibold">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
              <Clock size={15} style={{ color: "var(--text-muted)" }} />
              <span className="font-semibold">
                {formatTime(booking.start_time)} – {formatTime(endTime)} ({booking.duration_hours}h)
              </span>
            </div>
          </div>

          {booking.service_title && (
            <div
              className="text-xs px-3 py-2 rounded-xl font-medium flex items-center justify-between"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <span>{booking.service_title}</span>
              {totalPrice != null && <span className="font-bold">RM {totalPrice}</span>}
            </div>
          )}

          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {s.note}
          </p>

          {notice && (
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-green-500/10 text-green-500">
              <CheckCircle2 size={14} className="flex-shrink-0" /> {notice}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          {canModify && mode === "view" && (
            <div className="flex gap-2">
              <button
                onClick={() => { setNotice(""); setMode("reschedule"); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent-gradient)" }}
              >
                <CalendarClock size={14} /> Reschedule
              </button>
              <button
                onClick={() => { setNotice(""); setMode("confirm-cancel"); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                <XCircle size={14} /> Cancel booking
              </button>
            </div>
          )}

          {/* Cancel confirmation */}
          {mode === "confirm-cancel" && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "var(--bg-muted)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Cancel this booking?
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                This can&apos;t be undone. Your freelancer will be notified.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={pending}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {pending ? "Cancelling…" : "Yes, cancel it"}
                </button>
                <button
                  onClick={() => setMode("view")}
                  disabled={pending}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "var(--bg-card)", color: "var(--text)" }}
                >
                  Keep booking
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reschedule picker */}
        {mode === "reschedule" && (
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                Pick a new time
              </h2>
              <button
                onClick={() => { setMode("view"); setSelectedDate(null); setSelectedTime(null); }}
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Never mind
              </button>
            </div>

            {/* Dates */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                Date
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {upcomingDates.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No upcoming availability.
                  </p>
                )}
                {upcomingDates.map((d) => {
                  const active = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={
                        active
                          ? { background: "var(--accent-gradient)", color: "white" }
                          : { background: "var(--bg-muted)", color: "var(--text-muted)" }
                      }
                    >
                      {formatDateLabel(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            {selectedDate && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                  Start time · {booking.duration_hours}h session
                </p>
                {validTimes.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No open slots for this day. Try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {validTimes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className="py-2 rounded-xl text-xs font-semibold transition-all"
                        style={
                          selectedTime === t
                            ? { background: "var(--accent-gradient)", color: "white" }
                            : { background: "var(--bg-muted)", color: "var(--text-muted)" }
                        }
                      >
                        {formatTime(t)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || pending}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--accent-gradient)" }}
            >
              {pending ? "Moving…" : "Confirm new time"} <ArrowRight size={15} />
            </button>
            <p className="text-[11px] leading-relaxed text-center" style={{ color: "var(--text-muted)" }}>
              Rescheduling sends the booking back for approval.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
