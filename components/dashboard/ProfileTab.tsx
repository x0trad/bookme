"use client";
import { useState, useTransition } from "react";
import { Profile } from "@/types";
import { upsertProfile } from "@/app/dashboard/actions";
import { AvatarUpload } from "./AvatarUpload";
import { Save } from "lucide-react";

export function ProfileTab({
  profile,
  userEmail,
  userId,
}: {
  profile: Profile | null;
  userEmail: string;
  userId: string;
}) {
  const [error, setError]   = useState("");
  const [saved, setSaved]   = useState(false);
  const [pending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl]  = useState<string>(profile?.avatar_url ?? "");

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    // Inject the controlled avatar URL (may differ from original)
    fd.set("avatar_url", avatarUrl);
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

        {/* Signed-in email */}
        <div className="flex items-center gap-2 pb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "var(--accent)" }}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Signed in as <span className="font-semibold" style={{ color: "var(--text)" }}>{userEmail}</span>
          </p>
        </div>

        {/* Avatar upload */}
        <AvatarUpload
          userId={userId}
          currentUrl={avatarUrl || null}
          onUploaded={setAvatarUrl}
        />

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
