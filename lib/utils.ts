/** Generate next N occurrences of each weekday availability slot */
export function getUpcomingDates(
  availabilitySlots: { day_of_week: number; start_time: string; end_time: string }[],
  weeksAhead = 4
): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < weeksAhead * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay();

    // Find if any slot for this day still has hours remaining
    const hasRemainingSlots = availabilitySlots
      .filter((s) => s.day_of_week === dayOfWeek)
      .some((s) => {
        if (i > 0) return true; // future days always count
        const [endH] = s.end_time.split(":").map(Number);
        return currentHour < endH - 1; // at least 1h remaining today
      });

    if (hasRemainingSlots) {
      dates.push(d);
    }
  }
  return dates;
}

/** Format a Date as "Mon, May 6" */
export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "HH:MM" → readable "9:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Generate hourly slots between start and end time */
export function generateHourlySlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh] = startTime.split(":").map(Number);
  const [eh] = endTime.split(":").map(Number);
  for (let cur = sh; cur < eh; cur++) {
    slots.push(`${String(cur).padStart(2, "0")}:00`);
  }
  return slots;
}

/** Given approved bookings for a date, return blocked hour slots */
export function getBlockedSlots(
  bookings: { start_time: string; duration_hours: number }[]
): string[] {
  const blocked: string[] = [];
  for (const b of bookings) {
    const [h] = b.start_time.split(":").map(Number);
    for (let i = 0; i < b.duration_hours; i++) {
      blocked.push(`${String(h + i).padStart(2, "0")}:00`);
    }
  }
  return blocked;
}

/** Return valid start times for a given duration (needs N consecutive free slots) */
export function getValidStartTimes(
  allSlots: string[],
  blockedSlots: string[],
  durationHours: number
): string[] {
  return allSlots.filter((slot) => {
    const [h] = slot.split(":").map(Number);
    for (let i = 0; i < durationHours; i++) {
      const needed = `${String(h + i).padStart(2, "0")}:00`;
      if (!allSlots.includes(needed) || blockedSlots.includes(needed)) return false;
    }
    return true;
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
