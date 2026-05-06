import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Load services, availability, requests, reviews
  const freelancerId = profile?.id ?? null;

  const [
    { data: services },
    { data: availability },
    { data: requests },
    { data: reviews },
  ] = await Promise.all([
    freelancerId
      ? supabase.from("service_offerings").select("*").eq("freelancer_id", freelancerId).order("created_at")
      : { data: [] },
    freelancerId
      ? supabase.from("availability_slots").select("*").eq("freelancer_id", freelancerId).order("day_of_week")
      : { data: [] },
    freelancerId
      ? supabase.from("booking_requests").select("*, service_offerings(title, price)").eq("freelancer_id", freelancerId).order("created_at", { ascending: false })
      : { data: [] },
    freelancerId
      ? supabase.from("reviews").select("*").eq("freelancer_id", freelancerId).order("created_at", { ascending: false })
      : { data: [] },
  ]);

  return (
    <DashboardClient
      user={user}
      profile={profile ?? null}
      services={services ?? []}
      availability={availability ?? []}
      requests={requests ?? []}
      reviews={reviews ?? []}
    />
  );
}
