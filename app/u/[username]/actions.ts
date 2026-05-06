"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitBookingRequest(data: {
  freelancerId: string;
  serviceId: string | null;
  clientName: string;
  clientEmail: string;
  clientMessage: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
}) {
  const supabase = await createClient();

  // Server-side conflict check: look for approved bookings that overlap
  const { data: conflicts } = await supabase
    .from("booking_requests")
    .select("start_time, duration_hours")
    .eq("freelancer_id", data.freelancerId)
    .eq("booking_date", data.bookingDate)
    .eq("status", "approved");

  if (conflicts) {
    const [newH] = data.startTime.split(":").map(Number);
    const newEnd = newH + data.durationHours;
    for (const c of conflicts) {
      const [cH] = (c.start_time as string).split(":").map(Number);
      const cEnd = cH + (c.duration_hours as number);
      if (newH < cEnd && newEnd > cH) {
        return { error: "Those hours are no longer available. Please choose a different time." };
      }
    }
  }

  const { error } = await supabase.from("booking_requests").insert({
    freelancer_id: data.freelancerId,
    service_id: data.serviceId,
    client_name: data.clientName,
    client_email: data.clientEmail,
    client_message: data.clientMessage || null,
    booking_date: data.bookingDate,
    start_time: data.startTime,
    duration_hours: data.durationHours,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/u");
  return { success: true };
}

export async function submitReview(data: {
  bookingId: string;
  freelancerId: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
}) {
  const supabase = await createClient();

  // Verify the booking is approved
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("status, client_email")
    .eq("id", data.bookingId)
    .single();

  if (!booking || booking.status !== "approved") {
    return { error: "Reviews can only be left for approved bookings." };
  }

  // Prevent duplicate reviews
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", data.bookingId)
    .single();

  if (existing) {
    return { error: "A review has already been submitted for this booking." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: data.bookingId,
    freelancer_id: data.freelancerId,
    reviewer_name: data.reviewerName,
    reviewer_email: data.reviewerEmail,
    rating: data.rating,
    comment: data.comment || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/u");
  return { success: true };
}
