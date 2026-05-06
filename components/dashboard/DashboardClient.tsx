"use client";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Profile, ServiceOffering, AvailabilitySlot, BookingRequest, Review } from "@/types";
import { Zap, LayoutDashboard, Briefcase, Clock, User as UserIcon, LogOut, Copy, ExternalLink, Star, Share2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequestsTab } from "./RequestsTab";
import { ServicesTab } from "./ServicesTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { ProfileTab } from "./ProfileTab";
import { ShareCardTab } from "./ShareCardTab";
import { signOut } from "@/app/dashboard/actions";

type Tab = "requests" | "services" | "availability" | "profile" | "share";

interface Props {
  user: User;
  profile: Profile | null;
  services: ServiceOffering[];
  availability: AvailabilitySlot[];
  requests: BookingRequest[];
  reviews: Review[];
}

export function DashboardClient({ user, profile, services, availability, requests, reviews }: Props) {
  const [tab, setTab] = useState<Tab>("requests");
  const [copied, setCopied] = useState(false);

  const publicUrl = profile?.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.username}`
    : null;

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const avgRatingNum = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const avgRating = avgRatingNum !== null ? avgRatingNum.toFixed(1) : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "requests",     label: "Requests",    icon: <LayoutDashboard size={16} />, badge: pendingCount },
    { id: "services",     label: "Services",    icon: <Briefcase size={16} /> },
    { id: "availability", label: "Availability",icon: <Clock size={16} /> },
    { id: "profile",      label: "Profile",     icon: <UserIcon size={16} /> },
    { id: "share",        label: "Card",        icon: <Share2 size={16} /> },
  ];

  return (
    <div className="min-h-dvh bg-page flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b border-base bg-page/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </span>
            <span className="text-sm font-black" style={{ color: "var(--text)" }}>BookMe</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Review summary */}
            {avgRating && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-muted)] mr-1">
                <Star size={12} fill="var(--accent)" style={{ color: "var(--accent)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{avgRating}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>({reviews.length})</span>
              </div>
            )}
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-muted)]"
                title="Sign out"
              >
                <LogOut size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-5">
        {/* ── Profile summary card ── */}
        <div className="card p-4 flex items-center gap-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.name ?? "Avatar"}
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,var(--accent),#c084fc)", color: "white" }}
            >
              {(profile?.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>
              {profile?.name ?? user.email}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {profile?.username ? `@${profile.username}` : "No username set"}
            </p>
          </div>
          {publicUrl && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={copyLink}
                className="p-2 rounded-xl hover:bg-[var(--bg-muted)] transition-colors"
                title="Copy public link"
              >
                {copied ? (
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Copied!</span>
                ) : (
                  <Copy size={14} style={{ color: "var(--text-muted)" }} />
                )}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-[var(--bg-muted)] transition-colors"
                title="Open public page"
              >
                <ExternalLink size={14} style={{ color: "var(--text-muted)" }} />
              </a>
            </div>
          )}
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-[var(--bg-muted)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-150"
              style={
                tab === t.id
                  ? { background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 1px 4px rgba(0,0,0,.12)" }
                  : { color: "var(--text-muted)" }
              }
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1">
          {tab === "requests" && (
            <RequestsTab requests={requests} />
          )}
          {tab === "services" && (
            <ServicesTab services={services} profileId={profile?.id ?? null} />
          )}
          {tab === "availability" && (
            <AvailabilityTab availability={availability} profileId={profile?.id ?? null} />
          )}
          {tab === "profile" && (
            <ProfileTab profile={profile} userEmail={user.email ?? ""} />
          )}
          {tab === "share" && profile && (
            <ShareCardTab
              profile={profile}
              services={services}
              availability={availability}
              avgRating={avgRatingNum}
              reviewCount={reviews.length}
            />
          )}
          {tab === "share" && !profile && (
            <div className="card p-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Set up your profile first</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Go to the Profile tab and save your name and username.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
