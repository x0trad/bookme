"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendNewBookingEmail, sendBookingReceivedEmail } from "@/lib/email";

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

  // Insert via RPC so a secret manage token is created atomically
  const { data: created, error } = await supabase.rpc("create_booking_request", {
    p_freelancer_id: data.freelancerId,
    p_service_id: data.serviceId,
    p_client_name: data.clientName,
    p_client_email: data.clientEmail,
    p_client_message: data.clientMessage || "",
    p_booking_date: data.bookingDate,
    p_start_time: data.startTime,
    p_duration_hours: data.durationHours,
  });

  if (error) {
    if (error.message.includes("SLOT_TAKEN")) {
      return { error: "Those hours are no longer available. Please choose a different time." };
    }
    return { error: error.message };
  }

  const manageToken: string | null =
    Array.isArray(created) && created[0]?.manage_token ? created[0].manage_token : null;

  // Email the freelancer about the new request
  try {
    const { data: freelancerProfile } = await supabase
      .from("profiles")
      .select("name, username, email")
      .eq("id", data.freelancerId)
      .single();

    let serviceTitle: string | null = null;
    if (data.serviceId) {
      const { data: svc } = await supabase
        .from("service_offerings")
        .select("title")
        .eq("id", data.serviceId)
        .single();
      serviceTitle = svc?.title ?? null;
    }

    if (freelancerProfile?.email) {
      await sendNewBookingEmail({
        freelancerEmail: freelancerProfile.email as string,
        freelancerName: (freelancerProfile.name as string | null) ?? (freelancerProfile.username as string) ?? "there",
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientMessage: data.clientMessage || null,
        bookingDate: data.bookingDate,
        startTime: data.startTime,
        durationHours: data.durationHours,
        serviceTitle,
      });
    }

    // Confirmation to the client with their manage link
    if (manageToken) {
      await sendBookingReceivedEmail({
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        freelancerName:
          (freelancerProfile?.name as string | null) ??
          (freelancerProfile?.username as string) ??
          "your freelancer",
        bookingDate: data.bookingDate,
        startTime: data.startTime,
        durationHours: data.durationHours,
        serviceTitle,
        manageToken,
      });
    }
  } catch {
    // Email failure should not break the booking
  }

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
