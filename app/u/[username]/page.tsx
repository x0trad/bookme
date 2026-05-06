import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicProfileClient } from "@/components/public/PublicProfileClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, bio")
    .eq("username", username)
    .single();

  return {
    title: profile ? `Book ${profile.name ?? username} — BookMe` : "BookMe",
    description: profile?.bio ?? `Book a session with ${username}`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [
    { data: services },
    { data: availability },
    { data: reviews },
    { data: approvedBookings },
  ] = await Promise.all([
    supabase.from("service_offerings").select("*").eq("freelancer_id", profile.id).order("price"),
    supabase.from("availability_slots").select("*").eq("freelancer_id", profile.id),
    supabase
      .from("reviews")
      .select("*")
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("booking_requests")
      .select("booking_date, start_time, duration_hours")
      .eq("freelancer_id", profile.id)
      .eq("status", "approved"),
  ]);

  return (
    <PublicProfileClient
      profile={profile}
      services={services ?? []}
      availability={availability ?? []}
      reviews={reviews ?? []}
      approvedBookings={approvedBookings ?? []}
    />
  );
}
