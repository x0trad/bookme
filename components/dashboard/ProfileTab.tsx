"use client";
import { useState, useTransition } from "react";
import { Profile } from "@/types";
import { upsertProfile } from "@/app/dashboard/actions";
import { Save, User } from "lucide-react";

export function ProfileTab({
  profile,
  userEmail,
}: {
  profile: Profile | null;
  userEmail: string;
}) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertProfile(fd);
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="card p-5 flex flex-col gap-4">
        {/* Avatar preview */}
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,var(--accent),#c084fc)", color: "white" }}
            >
              <User size={24} />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{userEmail}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Signed in via magic link</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Full name
          </label>
          <input
            name="name"
            defaultValue={profile?.name ?? ""}
            placeholder="Jane Smith"
            className="input-base"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Username <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              @
            </span>
            <input
              name="username"
              required
              defaultValue={profile?.username ?? ""}
              placeholder="janeconsults"
              className="input-base pl-7"
            />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Lowercase letters, numbers, hyphens, underscores only.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Bio
          </label>
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="A sentence or two about what you do…"
            className="input-base resize-none h-20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Avatar URL
          </label>
          <input
            name="avatar_url"
            defaultValue={profile?.avatar_url ?? ""}
            placeholder="https://example.com/photo.jpg"
            className="input-base"
            type="url"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Skills
          </label>
          <input
            name="skills"
            defaultValue={(profile?.skills ?? []).join(", ")}
            placeholder="React, Node.js, UI Design, …"
            className="input-base"
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Comma-separated list.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        <Save size={15} />
        {saved ? "Profile saved!" : pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
