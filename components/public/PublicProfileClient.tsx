"use client";
import { useState } from "react";
import { Profile, ServiceOffering, AvailabilitySlot, Review } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookingForm } from "./BookingForm";
import { ReviewsSection } from "./ReviewsSection";
import { Star, Clock, DollarSign, ChevronRight, Zap, Check } from "lucide-react";
import {
  getUpcomingDates,
  formatDateLabel,
  generateHourlySlots,
  getBlockedSlots,
  getValidStartTimes,
  formatTime,
} from "@/lib/utils";
import Link from "next/link";

interface ApprovedBooking {
  booking_date: string;
  start_time: string;
  duration_hours: number;
}

interface Props {
  profile: Profile;
  services: ServiceOffering[];
  availability: AvailabilitySlot[];
  reviews: Review[];
  approvedBookings: ApprovedBooking[];
}

export function PublicProfileClient({ profile, services, availability, reviews, approvedBookings }: Props) {
  const upcomingDates = getUpcomingDates(availability);
  const [selectedDate, setSelectedDate] = useState<Date | null>(upcomingDates[0] ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(services[0] ?? null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const dateSlots = selectedDate
    ? availability
        .filter((a) => a.day_of_week === selectedDate.getDay())
        .flatMap((a) => generateHourlySlots(a.start_time, a.end_time))
    : [];

  const blockedSlots = selectedDate
    ? getBlockedSlots(
        approvedBookings
          .filter((b) => b.booking_date === selectedDate.toISOString().split("T")[0])
          .map((b) => ({ start_time: b.start_time, duration_hours: b.duration_hours }))
      )
    : [];

  const validStartTimes = getValidStartTimes(dateSlots, blockedSlots, selectedDuration);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const maxDuration = Math.max(
    ...availability
      .filter((a) => selectedDate && a.day_of_week === selectedDate.getDay())
      .map((a) => {
        const [sh] = a.start_time.split(":").map(Number);
        const [eh] = a.end_time.split(":").map(Number);
        return eh - sh;
      }),
    1
  );

  function handleDateSelect(d: Date) {
    setSelectedDate(d);
    setSelectedTime(null);
  }

  function handleDurationChange(d: number) {
    setSelectedDuration(d);
    setSelectedTime(null);
  }

  const bookingReady = selectedDate && selectedTime;

  return (
    <div className="min-h-dvh bg-page">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-base bg-page/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </span>
            <span className="text-sm font-black" style={{ color: "var(--text)" }}>BookMe</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-32">

        {/* ── Hero Profile Card ── */}
        <div className="mt-6 rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {/* Gradient banner */}
          <div
            className="h-24 w-full"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #c084fc 50%, #60a5fa 100%)" }}
          />
          {/* Content */}
          <div className="px-5 pb-5" style={{ background: "var(--bg-card)" }}>
            {/* Avatar (overlaps banner) */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.name ?? ""}
                  className="w-20 h-20 rounded-2xl object-cover"
                  style={{ boxShadow: "0 0 0 4px var(--bg-card)" }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                  style={{
                    background: "linear-gradient(135deg,var(--accent),#c084fc)",
                    color: "white",
                    boxShadow: "0 0 0 4px var(--bg-card)",
                  }}
                >
                  {(profile.name ?? profile.username ?? "?")[0].toUpperCase()}
                </div>
              )}
              </div>

            <h1 className="text-2xl font-black mb-0.5" style={{ color: "var(--text)" }}>
              {profile.name ?? profile.username}
            </h1>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>@{profile.username}</p>

            {/* ── Stars always visible ── */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={15}
                    fill={avgRating !== null && n <= Math.round(avgRating) ? "var(--accent)" : "transparent"}
                    style={{ color: avgRating !== null && n <= Math.round(avgRating) ? "var(--accent)" : "var(--border)" }}
                  />
                ))}
              </div>
              {avgRating !== null ? (
                <>
                  <span className="text-sm font-black" style={{ color: "var(--text)" }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>No reviews yet</span>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                {profile.bio}
              </p>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Services ── */}
        {services.length > 0 && (
          <div className="mt-8">
            <SectionLabel>Choose a Service</SectionLabel>
            <div className="flex flex-col gap-2 mt-3">
              {services.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className="w-full text-left rounded-2xl p-4 transition-all duration-150"
                    style={{
                      background: isSelected ? "var(--accent-light)" : "var(--bg-card)",
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{svc.title}</p>
                          {isSelected && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: "var(--accent)" }}
                            >
                              <Check size={11} className="text-white" />
                            </span>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                            {svc.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg" style={{ color: "var(--accent)" }}>RM{svc.price}</p>
                        <p className="text-xs flex items-center gap-0.5 justify-end" style={{ color: "var(--text-muted)" }}>
                          <Clock size={10} />{svc.duration_hours}h
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Date Picker ── */}
        {upcomingDates.length > 0 ? (
          <div className="mt-8">
            <SectionLabel>Pick a Date</SectionLabel>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
              {upcomingDates.map((d) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = d.getDate();
                const month = d.toLocaleDateString("en-US", { month: "short" });
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => handleDateSelect(d)}
                    className="flex-shrink-0 flex flex-col items-center gap-0 rounded-2xl transition-all duration-150 overflow-hidden"
                    style={{
                      width: 64,
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: isSelected ? "var(--accent)" : "var(--bg-card)",
                    }}
                  >
                    <div
                      className="w-full py-1 text-center text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: isSelected ? "rgba(0,0,0,0.15)" : "var(--bg-muted)",
                        color: isSelected ? "rgba(255,255,255,0.9)" : "var(--text-muted)",
                      }}
                    >
                      {dayName}
                    </div>
                    <div className="py-2.5 flex flex-col items-center">
                      <span
                        className="text-xl font-black leading-none"
                        style={{ color: isSelected ? "white" : "var(--text)" }}
                      >
                        {dayNum}
                      </span>
                      <span
                        className="text-[10px] font-medium mt-0.5"
                        style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}
                      >
                        {month}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>No availability set yet</p>
          </div>
        )}

        {/* ── Duration ── */}
        {selectedDate && (
          <div className="mt-8">
            <SectionLabel>Duration</SectionLabel>
            <div className="flex gap-2 mt-3 flex-wrap">
              {Array.from({ length: maxDuration }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  onClick={() => handleDurationChange(h)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150"
                  style={{
                    background: selectedDuration === h ? "var(--accent)" : "var(--bg-card)",
                    border: `2px solid ${selectedDuration === h ? "var(--accent)" : "var(--border)"}`,
                    color: selectedDuration === h ? "white" : "var(--text)",
                  }}
                >
                  {h}h
                  {selectedService && (
                    <span
                      className="block text-[10px] font-medium leading-none mt-0.5"
                      style={{ color: selectedDuration === h ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}
                    >
                      RM{(selectedService.price * h).toFixed(0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Time Slots ── */}
        {selectedDate && (
          <div className="mt-8">
            <div className="flex items-baseline gap-2 mb-3">
              <SectionLabel>Available Times</SectionLabel>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatDateLabel(selectedDate)}
              </span>
            </div>

            {validStartTimes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {validStartTimes.map((t) => {
                  const isSelected = selectedTime === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTime(t);
                        setShowBookingForm(true);
                      }}
                      className="rounded-xl py-3 text-sm font-bold transition-all duration-150 text-center"
                      style={{
                        background: isSelected ? "var(--accent)" : "var(--bg-card)",
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        color: isSelected ? "white" : "var(--text)",
                      }}
                    >
                      {formatTime(t)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  No {selectedDuration}h slots available — try a shorter duration or different date.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Booking Form ── */}
        {showBookingForm && selectedDate && selectedTime && (
          <div className="mt-6">
            <BookingForm
              freelancerId={profile.id}
              service={selectedService}
              date={selectedDate}
              startTime={selectedTime}
              durationHours={selectedDuration}
              onSuccess={() => {
                setShowBookingForm(false);
                setSelectedTime(null);
              }}
              onCancel={() => {
                setShowBookingForm(false);
                setSelectedTime(null);
              }}
            />
          </div>
        )}

        {/* ── Reviews ── */}
        <div className="mt-12">
          <ReviewsSection reviews={reviews} freelancerId={profile.id} />
        </div>
      </div>

      {/* ── Sticky bottom CTA ── */}
      {bookingReady && !showBookingForm && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3"
          style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowBookingForm(true)}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-between px-6 text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--accent), #c084fc)" }}
            >
              <div className="text-left">
                <div className="text-sm font-bold opacity-80">
                  {formatDateLabel(selectedDate!)} · {formatTime(selectedTime!)}
                </div>
                <div>
                  Book {selectedDuration}h
                  {selectedService ? ` — RM${(selectedService.price * selectedDuration).toFixed(0)}` : ""}
                </div>
              </div>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}
