"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Profile ─────────────────────────────────────────────────

export async function upsertProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const username = (formData.get("username") as string).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
  const bio = formData.get("bio") as string;
  const avatar_url = formData.get("avatar_url") as string;
  const skillsRaw = formData.get("skills") as string;
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Check username uniqueness (exclude self)
  if (username) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("username", username)
      .single();
    if (existing && existing.user_id !== user.id) {
      return { error: "Username is already taken" };
    }
  }

  const { error } = await supabase.from("profiles").upsert(
    { user_id: user.id, name, username, bio, avatar_url, skills },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Services ────────────────────────────────────────────────

export async function addService(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return { error: "Complete your profile first" };

  const { error } = await supabase.from("service_offerings").insert({
    freelancer_id: profile.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    duration_hours: Number(formData.get("duration_hours")),
    price: Number(formData.get("price")),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Ownership check: only delete if this service belongs to the current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("service_offerings")
    .delete()
    .eq("id", serviceId)
    .eq("freelancer_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Availability ────────────────────────────────────────────

export async function upsertAvailability(
  freelancerId: string,
  slots: { day_of_week: number; start_time: string; end_time: string }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete all existing slots and re-insert
  await supabase.from("availability_slots").delete().eq("freelancer_id", freelancerId);

  if (slots.length > 0) {
    const { error } = await supabase.from("availability_slots").insert(
      slots.map((s) => ({ ...s, freelancer_id: freelancerId }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Booking Requests ────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Ownership check: only update bookings that belong to the current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", bookingId)
    .eq("freelancer_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Sign Out ─────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
