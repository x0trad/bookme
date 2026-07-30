"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  sendBookingCancelledEmail,
  sendBookingRescheduledEmail,
} from "@/lib/email";
import type { ManagedBooking } from "@/types";

function friendlyError(message: string): string {
  if (message.includes("SLOT_TAKEN"))
    return "Those hours are no longer available. Please choose a different time.";
  if (message.includes("IN_PAST"))
    return "This booking is in the past and can no longer be changed.";
  if (message.includes("NOT_CANCELLABLE") || message.includes("NOT_RESCHEDULABLE"))
    return "This booking can no longer be changed.";
  if (message.includes("NOT_FOUND")) return "Booking not found.";
  return "Something went wrong. Please try again.";
}

async function notifyFreelancer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
  kind: "cancelled" | "rescheduled",
  prev?: { bookingDate: string; startTime: string }
) {
  try {
    const { data } = await supabase.rpc("get_booking_by_token", { p_token: token });
    const b = data as ManagedBooking | null;
    if (!b) return;

    const { data: freelancer } = await supabase
      .from("profiles")
      .select("email, name, username")
      .eq("id", b.freelancer_id)
      .single();
    if (!freelancer?.email) return;

    const base = {
      freelancerEmail: freelancer.email as string,
      freelancerName:
        (freelancer.name as string | null) ?? (freelancer.username as string) ?? "there",
      clientName: b.client_name,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      durationHours: b.duration_hours,
      serviceTitle: b.service_title,
    };

    if (kind === "cancelled") {
      await sendBookingCancelledEmail(base);
    } else {
      await sendBookingRescheduledEmail({
        ...base,
        previousDate: prev?.bookingDate ?? "",
        previousTime: prev?.startTime ?? "",
      });
    }
  } catch {
    // Email failure should not break the action
  }
}

export async function cancelBooking(token: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_booking_by_token", {
    p_token: token,
  });
  if (error) return { error: friendlyError(error.message) };

  await notifyFreelancer(supabase, token, "cancelled");

  revalidatePath(`/booking/${token}`);
  return { success: true };
}

export async function rescheduleBooking(data: {
  token: string;
  bookingDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  previousDate: string;
  previousTime: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("reschedule_booking_by_token", {
    p_token: data.token,
    p_date: data.bookingDate,
    p_start_time: data.startTime,
  });
  if (error) return { error: friendlyError(error.message) };

  await notifyFreelancer(supabase, data.token, "rescheduled", {
    bookingDate: data.previousDate,
    startTime: data.previousTime,
  });

  revalidatePath(`/booking/${data.token}`);
  return { success: true };
}
