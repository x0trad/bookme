"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";

const MAX_PX   = 400;   // max dimension after resize
const QUALITY  = 0.85;  // WebP quality
const MAX_MB   = 5;     // reject files over this size

interface Props {
  userId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

/** Resize + convert to WebP using an off-screen canvas. */
function toWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio  = Math.min(MAX_PX / img.width, MAX_PX / img.height, 1);
      const w      = Math.round(img.width  * ratio);
      const h      = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

export function AvatarUpload({ userId, currentUrl, onUploaded }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]  = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) { setError("Please pick an image file."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File must be under ${MAX_MB} MB.`); return; }

    setUploading(true);
    try {
      const webpBlob = await toWebP(file);
      const path     = `${userId}.webp`;
      const supabase = createClient();

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, webpBlob, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });

      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust cache with a timestamp so the browser re-fetches the new image
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (e) {
      setError((e as Error).message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearAvatar() {
    setPreview(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Profile photo
      </label>

      <div className="flex items-center gap-4">
        {/* Avatar preview circle */}
        <div className="relative flex-shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: "2px solid var(--border)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,var(--accent),#c084fc)" }}
            >
              <span className="text-3xl font-black text-white select-none">?</span>
            </div>
          )}
          {/* Clear button */}
          {preview && !uploading && (
            <button
              type="button"
              onClick={clearAvatar}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)" }}
            >
              <X size={11} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl transition-all"
          style={{
            border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
            background: dragging ? "var(--accent-light)" : "var(--bg-muted)",
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Converting &amp; uploading…
              </span>
            </>
          ) : (
            <>
              <Upload size={18} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                Click or drag &amp; drop
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Any image → saved as WebP · max {MAX_MB} MB
              </span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
