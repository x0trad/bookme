import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ManageBookingClient } from "@/components/public/ManageBookingClient";
import type { ManagedBooking } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Manage your booking — BookMe",
  robots: { index: false, follow: false },
};

export default async function ManageBookingPage({ params }: Props) {
  const { token } = await params;

  // Basic UUID sanity check before hitting the DB
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: booking } = await supabase.rpc("get_booking_by_token", {
    p_token: token,
  });

  if (!booking) notFound();

  const b = booking as ManagedBooking;

  // Availability + approved bookings for the reschedule picker
  const [{ data: availability }, { data: approvedBookings }] = await Promise.all([
    supabase.from("availability_slots").select("*").eq("freelancer_id", b.freelancer_id),
    supabase
      .from("booking_requests")
      .select("id, booking_date, start_time, duration_hours")
      .eq("freelancer_id", b.freelancer_id)
      .eq("status", "approved"),
  ]);

  return (
    <ManageBookingClient
      token={token}
      booking={b}
      availability={availability ?? []}
      approvedBookings={(approvedBookings ?? []).filter((x) => x.id !== b.id)}
    />
  );
}
