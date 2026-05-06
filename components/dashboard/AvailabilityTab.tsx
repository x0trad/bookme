"use client";
import { useState, useTransition } from "react";
import { AvailabilitySlot } from "@/types";
import { upsertAvailability } from "@/app/dashboard/actions";
import { Save } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DaySlot = { enabled: boolean; start: string; end: string };

function buildInitialState(availability: AvailabilitySlot[]): DaySlot[] {
  return DAYS.map((_, i) => {
    const slot = availability.find((a) => a.day_of_week === i);
    return slot
      ? { enabled: true, start: slot.start_time.slice(0, 5), end: slot.end_time.slice(0, 5) }
      : { enabled: false, start: "09:00", end: "17:00" };
  });
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={enabled}
      className="relative flex-shrink-0 focus:outline-none"
      style={{ width: 44, height: 26 }}
    >
      {/* Track */}
      <span
        className="block w-full h-full rounded-full transition-colors duration-200"
        style={{ background: enabled ? "var(--accent)" : "var(--border)" }}
      />
      {/* Thumb */}
      <span
        className="absolute top-[3px] block rounded-full bg-white shadow-md transition-transform duration-200"
        style={{
          width: 20,
          height: 20,
          left: 3,
          transform: enabled ? "translateX(18px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}

export function AvailabilityTab({
  availability,
  profileId,
}: {
  availability: AvailabilitySlot[];
  profileId: string | null;
}) {
  const [slots, setSlots] = useState<DaySlot[]>(() => buildInitialState(availability));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(dayIdx: number, field: keyof DaySlot, value: string | boolean) {
    setSlots((prev) => prev.map((s, i) => (i === dayIdx ? { ...s, [field]: value } : s)));
  }

  function handleSave() {
    if (!profileId) return;
    setError("");
    const toSave = slots
      .filter((s) => s.enabled && s.start < s.end)
      .map((s, i) => {
        const realIdx = slots.indexOf(s);
        return { day_of_week: realIdx !== -1 ? realIdx : i, start_time: s.start, end_time: s.end };
      });

    // Rebuild with correct indices
    const payload = slots
      .map((s, i) => ({ day_of_week: i, start_time: s.start, end_time: s.end, enabled: s.enabled }))
      .filter((s) => s.enabled && s.start_time < s.end_time)
      .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }));

    void toSave;
    startTransition(async () => {
      const res = await upsertAvailability(profileId, payload);
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Toggle the days you&apos;re available and set your working hours.
      </p>

      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {DAYS.map((day, i) => (
          <div
            key={day}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom: i < DAYS.length - 1 ? "1px solid var(--border)" : "none",
              background: slots[i].enabled ? "transparent" : "var(--bg-muted)",
              opacity: slots[i].enabled ? 1 : 0.65,
              transition: "opacity 0.15s",
            }}
          >
            {/* Toggle */}
            <Toggle enabled={slots[i].enabled} onChange={() => update(i, "enabled", !slots[i].enabled)} />

            {/* Day label */}
            <span
              className="text-sm font-semibold select-none"
              style={{
                width: 36,
                color: slots[i].enabled ? "var(--text)" : "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {DAY_SHORT[i]}
            </span>

            {/* Time inputs or unavailable */}
            {slots[i].enabled ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="time"
                  value={slots[i].start}
                  onChange={(e) => update(i, "start", e.target.value)}
                  className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                  style={{
                    background: "var(--bg-muted)",
                    border: "1.5px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>–</span>
                <input
                  type="time"
                  value={slots[i].end}
                  onChange={(e) => update(i, "end", e.target.value)}
                  className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                  style={{
                    background: "var(--bg-muted)",
                    border: "1.5px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              </div>
            ) : (
              <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>
                Unavailable
              </span>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

      <button
        onClick={handleSave}
        disabled={pending || !profileId}
        className="btn-primary w-full disabled:opacity-40"
      >
        <Save size={15} />
        {saved ? "Saved!" : pending ? "Saving…" : "Save availability"}
      </button>

      {!profileId && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Set a username in Profile first.
        </p>
      )}
    </div>
  );
}
