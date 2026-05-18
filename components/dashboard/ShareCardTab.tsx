"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Profile, ServiceOffering, AvailabilitySlot } from "@/types";
import { getUpcomingDates, generateHourlySlots, formatTime } from "@/lib/utils";
import { Download, RefreshCw, Palette } from "lucide-react";

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CW_H = 800, CH_H = 460; // horizontal / availability card
const CW_S = 600, CH_S = 600; // square / services card
const CW_B = 540, CH_B = 720; // bold / poster card (portrait)
const SCALE = 2;

type CardStyle = "availability" | "services" | "bold";
type Theme = "dark" | "light" | "brand";

const THEMES: Record<Theme, {
  bg1: string; bg2: string; card: string; border: string;
  text: string; muted: string; accent: string;
  accentBg: string; accentText: string;
  badgeBg: string; badgeText: string;
  pillBg: string; pillBorder: string;
  dateBg: string; dateBorder: string;
  ctaBg1: string; ctaBg2: string;
}> = {
  dark: {
    bg1: "#13111e", bg2: "#0d0b16",
    card: "#1e1b2e", border: "#2e2a45",
    text: "#f0eeff", muted: "rgba(240,238,255,0.42)",
    accent: "#a78bfa", accentBg: "rgba(139,92,246,0.18)", accentText: "#c4b5fd",
    badgeBg: "#22c55e", badgeText: "#ffffff",
    pillBg: "rgba(139,92,246,0.15)", pillBorder: "rgba(167,139,250,0.35)",
    dateBg: "rgba(255,255,255,0.06)", dateBorder: "rgba(255,255,255,0.14)",
    ctaBg1: "#7c3aed", ctaBg2: "#4f46e5",
  },
  light: {
    bg1: "#ffffff", bg2: "#f5f3ff",
    card: "#ffffff", border: "#ddd6fe",
    text: "#0f0e17", muted: "#6b6880",
    accent: "#7c3aed", accentBg: "#ede9fe", accentText: "#6d28d9",
    badgeBg: "#22c55e", badgeText: "#ffffff",
    pillBg: "#ede9fe", pillBorder: "#c4b5fd",
    dateBg: "#f5f3ff", dateBorder: "#ddd6fe",
    ctaBg1: "#7c3aed", ctaBg2: "#6366f1",
  },
  brand: {
    bg1: "#2e1065", bg2: "#1e1b4b",
    card: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)",
    text: "#ffffff", muted: "rgba(255,255,255,0.52)",
    accent: "#e9d5ff", accentBg: "rgba(255,255,255,0.1)", accentText: "#e9d5ff",
    badgeBg: "#4ade80", badgeText: "#14532d",
    pillBg: "rgba(255,255,255,0.1)", pillBorder: "rgba(255,255,255,0.22)",
    dateBg: "rgba(255,255,255,0.08)", dateBorder: "rgba(255,255,255,0.2)",
    ctaBg1: "#a855f7", ctaBg2: "#ec4899",
  },
};

// ─── Canvas helpers ────────────────────────────────────────────────────────────
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, filled: boolean, color: string, emptyColor: string) {
  const spikes = 5, inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    i === 0 ? ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
             : ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? color : emptyColor;
  ctx.fill();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "bold 10px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "2.2px";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Background presets ───────────────────────────────────────────────────────
export const BG_PRESETS = [
  { id: "default", label: "Default",  c1: null,      c2: null      },
  { id: "dusk",    label: "Dusk",     c1: "#3b0764", c2: "#be185d" },
  { id: "ocean",   label: "Ocean",    c1: "#0c4a6e", c2: "#4338ca" },
  { id: "sunset",  label: "Sunset",   c1: "#7f1d1d", c2: "#c2410c" },
  { id: "forest",  label: "Forest",   c1: "#14532d", c2: "#1e3a5f" },
  { id: "midnight",label: "Midnight", c1: "#0f172a", c2: "#1e1b4b" },
  { id: "rose",    label: "Rose",     c1: "#881337", c2: "#6d28d9" },
  { id: "ember",   label: "Ember",    c1: "#78350f", c2: "#7f1d1d" },
  { id: "teal",    label: "Teal",     c1: "#134e4a", c2: "#1e3a5f" },
  { id: "aurora",  label: "Aurora",   c1: "#064e3b", c2: "#312e81" },
  { id: "custom",  label: "Custom",   c1: "custom",  c2: "custom"  },
] as const;

// ─── DRAW: Bold / poster card (portrait 540×720) ─────────────────────────────
interface DrawBoldCardOptions {
  profile: Profile;
  services: ServiceOffering[];
  theme: Theme;
  bgOverride: { c1: string; c2: string } | null;
  avgRating: number | null;
  reviewCount: number;
  appUrl: string;
}

async function drawBoldCard(canvas: HTMLCanvasElement, opts: DrawBoldCardOptions) {
  const ctx = canvas.getContext("2d")!;
  canvas.width  = CW_B * SCALE;
  canvas.height = CH_B * SCALE;
  ctx.scale(SCALE, SCALE);

  const C   = THEMES[opts.theme];
  const CW  = CW_B, CH = CH_B;
  const PAD = 28;
  const name     = opts.profile.name     ?? opts.profile.username ?? "Freelancer";
  const username = opts.profile.username ?? "user";
  const initial  = name[0].toUpperCase();
  const bookingUrl = `${opts.appUrl}/u/${username}`;
  const svcs = opts.services.slice(0, 4);

  // ── Background ───────────────────────────────────────────────────────────────
  const bg1 = opts.bgOverride ? opts.bgOverride.c1 : C.bg1;
  const bg2 = opts.bgOverride ? opts.bgOverride.c2 : C.bg2;
  const bgGrad = ctx.createLinearGradient(0, 0, CW * 0.4, CH);
  bgGrad.addColorStop(0, bg1);
  bgGrad.addColorStop(1, bg2);
  ctx.fillStyle = bgGrad;
  rr(ctx, 0, 0, CW, CH, 28); ctx.fill();

  // Diagonal noise overlay — subtle texture strip
  const texGrad = ctx.createLinearGradient(0, 0, CW, 0);
  texGrad.addColorStop(0, "rgba(255,255,255,0.00)");
  texGrad.addColorStop(0.6, "rgba(255,255,255,0.04)");
  texGrad.addColorStop(1, "rgba(255,255,255,0.00)");
  ctx.fillStyle = texGrad;
  rr(ctx, 0, 0, CW, CH, 28); ctx.fill();

  // Bold accent bar — full-width top strip
  const accentBarH = 6;
  const barGrad = ctx.createLinearGradient(0, 0, CW, 0);
  barGrad.addColorStop(0, C.ctaBg1);
  barGrad.addColorStop(1, C.ctaBg2);
  ctx.save();
  rr(ctx, 0, 0, CW, CH, 28); ctx.clip();
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, CW, accentBarH);
  ctx.restore();

  let y = accentBarH + 24;

  // ── Avatar row ───────────────────────────────────────────────────────────────
  const avSize = 52;
  const avX = PAD, avY = y;
  const avGrad = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize);
  avGrad.addColorStop(0, C.ctaBg1); avGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = avGrad;
  rr(ctx, avX, avY, avSize, avSize, 14); ctx.fill();

  if (opts.profile.avatar_url) {
    try {
      const img = await loadImage(opts.profile.avatar_url);
      ctx.save(); rr(ctx, avX, avY, avSize, avSize, 14); ctx.clip();
      ctx.drawImage(img, avX, avY, avSize, avSize); ctx.restore();
    } catch {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `bold 22px -apple-system,system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 8);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `bold 22px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 8);
    ctx.textAlign = "left";
  }

  // AVAILABLE badge (right-aligned)
  const badgeTxt = "AVAILABLE";
  ctx.font = "bold 9px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.2px";
  const badgeW = ctx.measureText(badgeTxt).width + 22;
  ctx.letterSpacing = "0px";
  const badgeH = 22, badgeX = CW - PAD - badgeW, badgeY = avY + (avSize - badgeH) / 2;
  ctx.fillStyle = C.badgeBg;
  rr(ctx, badgeX, badgeY, badgeW, badgeH, 11); ctx.fill();
  ctx.fillStyle = C.badgeText;
  ctx.font = "bold 9px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.2px"; ctx.textAlign = "center";
  ctx.fillText(badgeTxt, badgeX + badgeW / 2, badgeY + 14.5);
  ctx.letterSpacing = "0px"; ctx.textAlign = "left";

  y = avY + avSize + 18;

  // ── Large name ────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.text;
  ctx.font = `900 38px -apple-system,system-ui,sans-serif`;
  const displayName = name.length > 18 ? name.slice(0, 17) + "…" : name;
  ctx.fillText(displayName, PAD, y);
  y += 8;

  // Handle + stars on same line
  ctx.fillStyle = C.muted;
  ctx.font = `13px -apple-system,system-ui,sans-serif`;
  ctx.fillText(`@${username}`, PAD, y + 18);

  // Stars (right-side of handle line)
  const starX = PAD + ctx.measureText(`@${username}`).width + 16;
  const starY2 = y + 12, starSize = 7;
  const filled = Math.round(opts.avgRating ?? 0);
  for (let i = 0; i < 5; i++)
    drawStar(ctx, starX + 8 + i * 17, starY2, starSize, i < filled, C.accent, C.border);
  if (opts.avgRating !== null) {
    ctx.fillStyle = C.text;
    ctx.font = `bold 11px -apple-system,system-ui,sans-serif`;
    ctx.fillText(opts.avgRating.toFixed(1), starX + 92, starY2 + 4);
  }
  y += 32;

  // ── Full-width divider ────────────────────────────────────────────────────────
  ctx.save(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(CW - PAD, y); ctx.stroke();
  ctx.restore();
  y += 18;

  // ── SERVICES label ────────────────────────────────────────────────────────────
  label(ctx, "SERVICES", PAD, y, C.muted);
  y += 16;

  // ── Service rows — big price, compact ────────────────────────────────────────
  const ctaH = 48;
  const availH = CH - PAD - ctaH - y - 16;
  const rowCount = Math.max(svcs.length, 1);
  const rowGap = 8;
  const rowH = Math.min(80, Math.floor((availH - rowGap * (rowCount - 1)) / rowCount));

  svcs.forEach((svc, i) => {
    const rx = PAD, ry = y + i * (rowH + rowGap);
    const rw = CW - PAD * 2;

    // Row bg
    ctx.fillStyle = C.pillBg;
    ctx.strokeStyle = C.pillBorder;
    ctx.lineWidth = 1;
    rr(ctx, rx, ry, rw, rowH, 14); ctx.fill(); ctx.stroke();

    // Index number (left gutter, large muted)
    ctx.fillStyle = C.muted;
    ctx.font = `900 11px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.4;
    ctx.fillText(`${i + 1}`, rx + 16, ry + rowH / 2 + 4);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    // Service title — large and bold
    const titleX = rx + 32;
    ctx.fillStyle = C.text;
    ctx.font = `800 ${rowH >= 70 ? 18 : 16}px -apple-system,system-ui,sans-serif`;
    const maxTitleW = rw - 32 - 90;
    const maxChars = Math.floor(maxTitleW / (rowH >= 70 ? 10.5 : 9.5));
    const titleStr = svc.title.length > maxChars ? svc.title.slice(0, maxChars - 1) + "…" : svc.title;
    ctx.fillText(titleStr, titleX, ry + rowH / 2 - (rowH >= 70 ? 5 : 3));

    // Duration subtitle
    ctx.fillStyle = C.muted;
    ctx.font = `11px -apple-system,system-ui,sans-serif`;
    ctx.fillText(`${svc.duration_hours}h session`, titleX, ry + rowH / 2 + 13);

    // Price — large, right-aligned, colored
    ctx.fillStyle = C.accentText;
    ctx.font = `900 ${rowH >= 70 ? 28 : 24}px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`RM${svc.price}`, rx + rw - 16, ry + rowH / 2 + (rowH >= 70 ? 10 : 8));
    ctx.textAlign = "left";
  });

  y += rowCount * (rowH + rowGap) + 8;

  // ── CTA bar ───────────────────────────────────────────────────────────────────
  const ctaGrad = ctx.createLinearGradient(PAD, 0, CW - PAD, 0);
  ctaGrad.addColorStop(0, C.ctaBg1); ctaGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = ctaGrad;
  rr(ctx, PAD, CH - PAD - ctaH, CW - PAD * 2, ctaH, 12); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `bold 9px -apple-system,system-ui,sans-serif`;
  ctx.letterSpacing = "1.5px";
  ctx.fillText("BOOK NOW", PAD + 16, CH - PAD - ctaH + 18);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 14px -apple-system,system-ui,sans-serif`;
  ctx.fillText(bookingUrl, PAD + 16, CH - PAD - ctaH + 35);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `bold 18px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("→", CW - PAD - 14, CH - PAD - ctaH + 31);
  ctx.textAlign = "left";

  // Footer
  ctx.fillStyle = C.muted;
  ctx.font = `9px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Made with BookMe", CW - PAD, CH - 10);
  ctx.textAlign = "left";
}

// ─── DRAW: Square service card ────────────────────────────────────────────────
interface DrawServiceCardOptions {
  profile: Profile;
  services: ServiceOffering[];
  theme: Theme;
  bgOverride: { c1: string; c2: string } | null;
  avgRating: number | null;
  reviewCount: number;
  appUrl: string;
}

async function drawServiceCard(canvas: HTMLCanvasElement, opts: DrawServiceCardOptions) {
  const ctx = canvas.getContext("2d")!;
  canvas.width  = CW_S * SCALE;
  canvas.height = CH_S * SCALE;
  ctx.scale(SCALE, SCALE);

  const C   = THEMES[opts.theme];
  const PAD = 32;
  const CW  = CW_S, CH = CH_S;
  const name     = opts.profile.name     ?? opts.profile.username ?? "Freelancer";
  const username = opts.profile.username ?? "user";
  const initial  = name[0].toUpperCase();
  const bookingUrl = `${opts.appUrl}/u/${username}`;
  const svcs = opts.services.slice(0, 4);

  // ── Background ───────────────────────────────────────────────────────────────
  const bg1 = opts.bgOverride ? opts.bgOverride.c1 : C.bg1;
  const bg2 = opts.bgOverride ? opts.bgOverride.c2 : C.bg2;
  const bgGrad = ctx.createLinearGradient(0, 0, CW, CH);
  bgGrad.addColorStop(0, bg1);
  bgGrad.addColorStop(1, bg2);
  ctx.fillStyle = bgGrad;
  rr(ctx, 0, 0, CW, CH, 28); ctx.fill();

  const glow = ctx.createRadialGradient(CW * 0.85, 30, 0, CW * 0.85, 30, 260);
  glow.addColorStop(0, "rgba(255,255,255,0.08)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  rr(ctx, 0, 0, CW, CH, 28); ctx.fill();

  // ── AVAILABLE badge ──────────────────────────────────────────────────────────
  const badgeTxt = "AVAILABLE";
  ctx.font = "bold 10.5px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.5px";
  const badgeW = ctx.measureText(badgeTxt).width + 28;
  ctx.letterSpacing = "0px";
  const badgeH = 26, badgeX = CW - PAD - badgeW, badgeY = PAD;
  ctx.fillStyle = C.badgeBg;
  rr(ctx, badgeX, badgeY, badgeW, badgeH, 13); ctx.fill();
  ctx.fillStyle = C.badgeText;
  ctx.font = "bold 10.5px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.5px"; ctx.textAlign = "center";
  ctx.fillText(badgeTxt, badgeX + badgeW / 2, badgeY + 17.5);
  ctx.letterSpacing = "0px"; ctx.textAlign = "left";

  // ── Avatar ───────────────────────────────────────────────────────────────────
  const avSize = 64, avX = PAD, avY = PAD;
  const avGrad = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize);
  avGrad.addColorStop(0, C.ctaBg1); avGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = avGrad;
  rr(ctx, avX, avY, avSize, avSize, 16); ctx.fill();

  if (opts.profile.avatar_url) {
    try {
      const img = await loadImage(opts.profile.avatar_url);
      ctx.save(); rr(ctx, avX, avY, avSize, avSize, 16); ctx.clip();
      ctx.drawImage(img, avX, avY, avSize, avSize); ctx.restore();
    } catch {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `bold 26px -apple-system,system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 9);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `bold 26px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 9);
    ctx.textAlign = "left";
  }

  // ── Name + handle + stars ────────────────────────────────────────────────────
  const txtX = avX + avSize + 14;
  ctx.fillStyle = C.text;
  ctx.font = `bold 20px -apple-system,system-ui,sans-serif`;
  ctx.fillText(name.length > 22 ? name.slice(0, 21) + "…" : name, txtX, avY + 22);
  ctx.fillStyle = C.muted;
  ctx.font = `12px -apple-system,system-ui,sans-serif`;
  ctx.fillText(`@${username}`, txtX, avY + 40);
  const starY = avY + 56, starSize = 7.5;
  const filledCount = Math.round(opts.avgRating ?? 0);
  for (let i = 0; i < 5; i++)
    drawStar(ctx, txtX + 8 + i * 18, starY, starSize, i < filledCount, C.accent, C.border);
  if (opts.avgRating !== null) {
    ctx.fillStyle = C.text;
    ctx.font = `bold 11px -apple-system,system-ui,sans-serif`;
    ctx.fillText(opts.avgRating.toFixed(1), txtX + 99, starY + 4);
    ctx.fillStyle = C.muted;
    ctx.font = `10px -apple-system,system-ui,sans-serif`;
    ctx.fillText(`(${opts.reviewCount})`, txtX + 115, starY + 4);
  } else {
    ctx.fillStyle = C.muted;
    ctx.font = `10px -apple-system,system-ui,sans-serif`;
    ctx.fillText("No reviews yet", txtX + 99, starY + 4);
  }

  // ── Divider ──────────────────────────────────────────────────────────────────
  const divY = avY + avSize + 18;
  ctx.save(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(PAD, divY); ctx.lineTo(CW - PAD, divY); ctx.stroke();
  ctx.restore();

  // ── SERVICES label ────────────────────────────────────────────────────────────
  let y = divY + 16;
  label(ctx, "SERVICES", PAD, y, C.muted);
  y += 14;

  // ── Service rows ──────────────────────────────────────────────────────────────
  const rowH   = svcs.length > 0
    ? Math.min(72, Math.floor((CH - PAD - 60 - y) / Math.max(svcs.length, 1)))
    : 72;
  const rowGap = svcs.length <= 3 ? 10 : 8;

  svcs.forEach((svc, i) => {
    const rx = PAD, ry = y + i * (rowH + rowGap);
    const rw = CW - PAD * 2, rh = rowH;

    // Row background
    ctx.fillStyle = C.pillBg;
    ctx.strokeStyle = C.pillBorder;
    ctx.lineWidth = 1;
    rr(ctx, rx, ry, rw, rh, 14); ctx.fill(); ctx.stroke();

    // Accent left strip
    const stripW = 5;
    const accentGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    accentGrad.addColorStop(0, C.ctaBg1);
    accentGrad.addColorStop(1, C.ctaBg2);
    ctx.fillStyle = accentGrad;
    ctx.save();
    rr(ctx, rx, ry, rw, rh, 14); ctx.clip();
    ctx.fillRect(rx, ry, stripW, rh);
    ctx.restore();

    const innerX = rx + stripW + 16;

    // Price (large, colored)
    ctx.fillStyle = C.accentText;
    ctx.font = `bold 22px -apple-system,system-ui,sans-serif`;
    const priceStr = `RM${svc.price}`;
    ctx.fillText(priceStr, innerX, ry + rh / 2 + 1);
    const priceW = ctx.measureText(priceStr).width;

    // Vertical divider after price
    const dvX = innerX + priceW + 14;
    ctx.save(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(dvX, ry + rh * 0.22);
    ctx.lineTo(dvX, ry + rh * 0.78);
    ctx.stroke(); ctx.restore();

    // Title + duration
    const textAreaX = dvX + 14;
    const maxW = rw - (textAreaX - rx) - 20;
    ctx.font = `bold 14px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle = C.text;
    const maxChars = Math.floor(maxW / 8);
    const title = svc.title.length > maxChars ? svc.title.slice(0, maxChars - 1) + "…" : svc.title;
    ctx.fillText(title, textAreaX, ry + rh / 2 - 5);

    ctx.font = `11px -apple-system,system-ui,sans-serif`;
    ctx.fillStyle = C.muted;
    ctx.fillText(`${svc.duration_hours}h session`, textAreaX, ry + rh / 2 + 12);

    // Arrow chevron (right edge)
    ctx.fillStyle = C.muted;
    ctx.font = `bold 16px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "right";
    ctx.globalAlpha = 0.5;
    ctx.fillText("›", rx + rw - 16, ry + rh / 2 + 6);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  });

  y += svcs.length * (rowH + rowGap);

  // ── CTA bar ───────────────────────────────────────────────────────────────────
  const ctaH = 44;
  const ctaGrad = ctx.createLinearGradient(PAD, 0, CW - PAD, 0);
  ctaGrad.addColorStop(0, C.ctaBg1); ctaGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = ctaGrad;
  rr(ctx, PAD, CH - PAD - ctaH, CW - PAD * 2, ctaH, 12); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `bold 9.5px -apple-system,system-ui,sans-serif`;
  ctx.letterSpacing = "1.5px";
  ctx.fillText("BOOK NOW", PAD + 16, CH - PAD - ctaH + 17);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 14px -apple-system,system-ui,sans-serif`;
  ctx.fillText(bookingUrl, PAD + 16, CH - PAD - ctaH + 34);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `bold 18px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("→", CW - PAD - 16, CH - PAD - ctaH + 30);
  ctx.textAlign = "left";

  // ── Footer ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.muted;
  ctx.font = `10px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Made with BookMe", CW - PAD, CH - 10);
  ctx.textAlign = "left";
}

// ─── DRAW: Availability card ──────────────────────────────────────────────────
interface DrawOptions {
  profile: Profile;
  selectedServices: ServiceOffering[];
  selectedDates: Date[];
  selectedTimes: string[];
  theme: Theme;
  bgOverride: { c1: string; c2: string } | null;
  avgRating: number | null;
  reviewCount: number;
  appUrl: string;
}

async function drawCard(canvas: HTMLCanvasElement, opts: DrawOptions) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CW_H * SCALE;
  canvas.height = CH_H * SCALE;
  ctx.scale(SCALE, SCALE);

  const C = THEMES[opts.theme];
  const PAD = 32;
  const CW = CW_H, CH = CH_H;
  const name = opts.profile.name ?? opts.profile.username ?? "Freelancer";
  const username = opts.profile.username ?? "user";
  const initial = name[0].toUpperCase();
  const bookingUrl = `${opts.appUrl}/u/${username}`;

  // ── Background ──────────────────────────────────────────────────────────────
  const bg1 = opts.bgOverride ? opts.bgOverride.c1 : C.bg1;
  const bg2 = opts.bgOverride ? opts.bgOverride.c2 : C.bg2;
  const bgGrad = ctx.createLinearGradient(0, 0, CW, CH);
  bgGrad.addColorStop(0, bg1);
  bgGrad.addColorStop(1, bg2);
  ctx.fillStyle = bgGrad;
  rr(ctx, 0, 0, CW, CH, 28);
  ctx.fill();

  // Subtle inner glow at top-left
  const glow = ctx.createRadialGradient(80, 80, 0, 80, 80, 220);
  glow.addColorStop(0, "rgba(255,255,255,0.09)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  rr(ctx, 0, 0, CW, CH, 28);
  ctx.fill();

  // Subtle bottom-right shadow bloom
  const bloom = ctx.createRadialGradient(CW, CH, 0, CW, CH, 280);
  bloom.addColorStop(0, "rgba(0,0,0,0.18)");
  bloom.addColorStop(1, "transparent");
  ctx.fillStyle = bloom;
  rr(ctx, 0, 0, CW, CH, 28);
  ctx.fill();

  // ── AVAILABLE badge (top-right) ──────────────────────────────────────────────
  const badgeTxt = "AVAILABLE";
  ctx.font = "bold 10.5px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.5px";
  const badgeW = ctx.measureText(badgeTxt).width + 28;
  ctx.letterSpacing = "0px";
  const badgeH = 26, badgeX = CW - PAD - badgeW, badgeY = PAD;

  ctx.fillStyle = C.badgeBg;
  rr(ctx, badgeX, badgeY, badgeW, badgeH, 13);
  ctx.fill();

  ctx.fillStyle = C.badgeText;
  ctx.font = "bold 10.5px -apple-system,system-ui,sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.textAlign = "center";
  ctx.fillText(badgeTxt, badgeX + badgeW / 2, badgeY + 17.5);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const avSize = 68, avX = PAD, avY = PAD;
  const avGrad = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize);
  avGrad.addColorStop(0, C.ctaBg1);
  avGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = avGrad;
  rr(ctx, avX, avY, avSize, avSize, 18);
  ctx.fill();

  if (opts.profile.avatar_url) {
    try {
      const img = await loadImage(opts.profile.avatar_url);
      ctx.save();
      rr(ctx, avX, avY, avSize, avSize, 18);
      ctx.clip();
      ctx.drawImage(img, avX, avY, avSize, avSize);
      ctx.restore();
    } catch {
      // fall through to initial
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `bold 28px -apple-system,system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 10);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `bold 28px -apple-system,system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(initial, avX + avSize / 2, avY + avSize / 2 + 10);
    ctx.textAlign = "left";
  }

  // ── Name + handle + stars ────────────────────────────────────────────────────
  const txtX = avX + avSize + 16;
  ctx.fillStyle = C.text;
  ctx.font = `bold 22px -apple-system,system-ui,sans-serif`;
  ctx.fillText(name.length > 20 ? name.slice(0, 19) + "…" : name, txtX, avY + 24);

  ctx.fillStyle = C.muted;
  ctx.font = `13px -apple-system,system-ui,sans-serif`;
  ctx.fillText(`@${username}`, txtX, avY + 44);

  // Stars row
  const starY = avY + 60, starSize = 8;
  const filledCount = Math.round(opts.avgRating ?? 0);
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, txtX + 9 + i * 20, starY, starSize, i < filledCount, C.accent, C.border);
  }
  if (opts.avgRating !== null) {
    ctx.fillStyle = C.text;
    ctx.font = `bold 12px -apple-system,system-ui,sans-serif`;
    ctx.fillText(opts.avgRating.toFixed(1), txtX + 113, starY + 4.5);
    ctx.fillStyle = C.muted;
    ctx.font = `11px -apple-system,system-ui,sans-serif`;
    ctx.fillText(`(${opts.reviewCount} review${opts.reviewCount !== 1 ? "s" : ""})`, txtX + 132, starY + 4.5);
  } else {
    ctx.fillStyle = C.muted;
    ctx.font = `11px -apple-system,system-ui,sans-serif`;
    ctx.fillText("No reviews yet", txtX + 113, starY + 4.5);
  }

  // ── Divider ──────────────────────────────────────────────────────────────────
  const divY = avY + avSize + 20;
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(PAD, divY);
  ctx.lineTo(CW - PAD, divY);
  ctx.stroke();
  ctx.restore();

  // ── SERVICES ─────────────────────────────────────────────────────────────────
  let y = divY + 14;
  label(ctx, "SERVICES", PAD, y, C.muted);
  y += 13;

  if (opts.selectedServices.length > 0) {
    const totalW = CW - PAD * 2;
    const count = Math.min(opts.selectedServices.length, 4);
    const gap = 10;
    const pillW = (totalW - gap * (count - 1)) / count;
    const pillH = 40;

    opts.selectedServices.slice(0, 4).forEach((svc, i) => {
      const px = PAD + i * (pillW + gap);
      ctx.fillStyle = C.pillBg;
      ctx.strokeStyle = C.pillBorder;
      ctx.lineWidth = 1;
      rr(ctx, px, y, pillW, pillH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.accentText;
      ctx.font = `bold 14px -apple-system,system-ui,sans-serif`;
      ctx.fillText(`RM${svc.price}`, px + 12, y + 16);

      ctx.fillStyle = C.text;
      ctx.font = `12px -apple-system,system-ui,sans-serif`;
      const maxChars = Math.floor(pillW / 7.5);
      const title = svc.title.length > maxChars ? svc.title.slice(0, maxChars - 1) + "…" : svc.title;
      ctx.fillText(title, px + 12, y + 32);
    });
    y += pillH + 12;
  } else {
    y += 8;
  }

  // ── AVAILABILITY: date boxes with time slots inside ──────────────────────────
  label(ctx, "AVAILABILITY", PAD, y, C.muted);
  y += 13;

  if (opts.selectedDates.length > 0) {
    const dates = opts.selectedDates.slice(0, 4);
    const times = opts.selectedTimes.slice(0, 6);

    const totalW = CW - PAD * 2;
    const colGap = 10;
    const colW = (totalW - colGap * (dates.length - 1)) / dates.length;

    const BP = 12; // box padding
    const innerW = colW - BP * 2;

    // Time pills: 3 per row
    const PILLS_PER_ROW = 3;
    const tGap = 4;
    const tPillH = 20;
    const tPillW = times.length > 0
      ? (innerW - tGap * (Math.min(times.length, PILLS_PER_ROW) - 1)) / Math.min(times.length, PILLS_PER_ROW)
      : 0;
    const timeRows = times.length > 0 ? Math.ceil(times.length / PILLS_PER_ROW) : 0;
    const timeSectionH = timeRows > 0 ? timeRows * tPillH + (timeRows - 1) * tGap : 0;

    // Measured section heights (all relative to box top)
    const STRIP_H   = 26;          // header strip height
    const NUM_Y     = STRIP_H + 10 + 22; // date number baseline (10 gap + 22px ascender)
    const MON_Y     = NUM_Y + 4 + 10;   // month baseline
    const DIV_Y     = MON_Y + 10;       // divider line y (10px gap below month)
    const TIME_Y    = DIV_Y + 10;       // time pills start y
    const boxH      = TIME_Y + timeSectionH + BP;

    dates.forEach((d, i) => {
      const bx = PAD + i * (colW + colGap);
      const by = y;

      // ── 1. Outer box ───────────────────────────────────────────────────────
      ctx.fillStyle = C.dateBg;
      ctx.strokeStyle = C.dateBorder;
      ctx.lineWidth = 1;
      rr(ctx, bx, by, colW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      // ── 2. Header strip — clipped to box shape so corners stay clean ───────
      ctx.save();
      rr(ctx, bx, by, colW, boxH, 12); // clip to box
      ctx.clip();
      ctx.fillStyle = C.border;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(bx, by, colW, STRIP_H);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Thin line under strip
      ctx.save();
      ctx.strokeStyle = C.dateBorder;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by + STRIP_H);
      ctx.lineTo(bx + colW, by + STRIP_H);
      ctx.stroke();
      ctx.restore();

      // ── 3. Day name (centered in strip) ───────────────────────────────────
      ctx.fillStyle = C.muted;
      ctx.font = `bold 9px -apple-system,system-ui,sans-serif`;
      ctx.letterSpacing = "1.5px";
      ctx.textAlign = "center";
      ctx.fillText(
        d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        bx + colW / 2, by + STRIP_H / 2 + 4
      );
      ctx.letterSpacing = "0px";

      // ── 4. Date number ────────────────────────────────────────────────────
      ctx.fillStyle = C.text;
      ctx.font = `bold 22px -apple-system,system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(d.getDate().toString(), bx + colW / 2, by + NUM_Y);

      // ── 5. Month ──────────────────────────────────────────────────────────
      ctx.fillStyle = C.muted;
      ctx.font = `9px -apple-system,system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        bx + colW / 2, by + MON_Y
      );

      // ── 6. Divider + time pills ────────────────────────────────────────────
      if (times.length > 0) {
        ctx.save();
        ctx.strokeStyle = C.dateBorder;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(bx + BP, by + DIV_Y);
        ctx.lineTo(bx + colW - BP, by + DIV_Y);
        ctx.stroke();
        ctx.restore();

        times.forEach((t, ti) => {
          const row = Math.floor(ti / PILLS_PER_ROW);
          const col = ti % PILLS_PER_ROW;
          const tx = bx + BP + col * (tPillW + tGap);
          const ty = by + TIME_Y + row * (tPillH + tGap);

          ctx.fillStyle = C.pillBg;
          ctx.strokeStyle = C.pillBorder;
          ctx.lineWidth = 1;
          rr(ctx, tx, ty, tPillW, tPillH, 5);
          ctx.fill();
          ctx.stroke();

          const [h] = t.split(":").map(Number);
          const period = h >= 12 ? "pm" : "am";
          const hour = h % 12 || 12;
          ctx.fillStyle = C.text;
          ctx.font = `bold 9.5px -apple-system,system-ui,sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(`${hour}${period}`, tx + tPillW / 2, ty + tPillH / 2 + 3.5);
        });
      }

      ctx.textAlign = "left";
    });
    y += boxH + 12;
  } else {
    y += 8;
  }

  // ── CTA bar ───────────────────────────────────────────────────────────────────
  const ctaH = 44;
  const ctaGrad = ctx.createLinearGradient(PAD, 0, CW - PAD, 0);
  ctaGrad.addColorStop(0, C.ctaBg1);
  ctaGrad.addColorStop(1, C.ctaBg2);
  ctx.fillStyle = ctaGrad;
  rr(ctx, PAD, CH - PAD - ctaH, CW - PAD * 2, ctaH, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `bold 9.5px -apple-system,system-ui,sans-serif`;
  ctx.letterSpacing = "1.5px";
  ctx.fillText("BOOK NOW", PAD + 16, CH - PAD - ctaH + 17);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 15px -apple-system,system-ui,sans-serif`;
  ctx.fillText(bookingUrl, PAD + 16, CH - PAD - ctaH + 35);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `bold 18px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("→", CW - PAD - 16, CH - PAD - ctaH + 31);
  ctx.textAlign = "left";

  // ── BookMe footer stamp ───────────────────────────────────────────────────────
  ctx.fillStyle = C.muted;
  ctx.font = `10px -apple-system,system-ui,sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Made with BookMe", CW - PAD, CH - 10);
  ctx.textAlign = "left";
}

// ─── React component ──────────────────────────────────────────────────────────
interface Props {
  profile: Profile;
  services: ServiceOffering[];
  availability: AvailabilitySlot[];
  avgRating: number | null;
  reviewCount: number;
}

export function ShareCardTab({ profile, services, availability, avgRating, reviewCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardStyle, setCardStyle] = useState<CardStyle>("availability");
  const upcomingDates = getUpcomingDates(availability, 3);

  // Derive unique sorted time slots from availability
  const availableTimes = useMemo(() => {
    const seen = new Set<string>();
    for (const slot of availability) {
      for (const t of generateHourlySlots(slot.start_time, slot.end_time)) {
        seen.add(t);
      }
    }
    return Array.from(seen).sort();
  }, [availability]);

  const [theme, setTheme] = useState<Theme>("dark");
  const [bgPresetId, setBgPresetId] = useState<string>("default");
  const [customC1, setCustomC1] = useState("#7c3aed");
  const [customC2, setCustomC2] = useState("#ec4899");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(services.slice(0, 4).map((s) => s.id))
  );
  const [selectedDateIdxs, setSelectedDateIdxs] = useState<Set<number>>(
    new Set(upcomingDates.slice(0, 4).map((_, i) => i))
  );
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(
    new Set(availableTimes.slice(0, 6))
  );
  const [rendering, setRendering] = useState(false);

  const selectedServices = services.filter((s) => selectedServiceIds.has(s.id));
  const selectedDates = upcomingDates.filter((_, i) => selectedDateIdxs.has(i));
  const selectedTimesList = availableTimes.filter((t) => selectedTimes.has(t));

  const bgOverride = useMemo(() => {
    if (bgPresetId === "default") return null;
    if (bgPresetId === "custom") return { c1: customC1, c2: customC2 };
    const preset = BG_PRESETS.find((p) => p.id === bgPresetId);
    if (!preset || !preset.c1 || !preset.c2 || preset.c1 === "custom") return null;
    return { c1: preset.c1, c2: preset.c2 };
  }, [bgPresetId, customC1, customC2]);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://bookme.app";

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    try {
      if (cardStyle === "services") {
        await drawServiceCard(canvas, {
          profile, services: selectedServices,
          theme, bgOverride, avgRating, reviewCount, appUrl,
        });
      } else if (cardStyle === "bold") {
        await drawBoldCard(canvas, {
          profile, services: selectedServices,
          theme, bgOverride, avgRating, reviewCount, appUrl,
        });
      } else {
        await drawCard(canvas, {
          profile, selectedServices, selectedDates,
          selectedTimes: selectedTimesList,
          theme, bgOverride, avgRating, reviewCount, appUrl,
        });
      }
    } finally {
      setRendering(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, cardStyle, theme, bgOverride, selectedServiceIds, selectedDateIdxs, selectedTimes, avgRating, reviewCount, appUrl]);

  useEffect(() => { render(); }, [render]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }
  function toggleDate(idx: number) {
    setSelectedDateIdxs((prev) => {
      const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
    });
  }
  function toggleTime(t: string) {
    setSelectedTimes((prev) => {
      const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n;
    });
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookme-${cardStyle}-${profile.username ?? "card"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const THEME_OPTIONS: { id: Theme; label: string; colors: string[] }[] = [
    { id: "dark",  label: "Dark",  colors: ["#13111e", "#7c3aed"] },
    { id: "light", label: "Light", colors: ["#f5f3ff", "#7c3aed"] },
    { id: "brand", label: "Brand", colors: ["#2e1065", "#a855f7"] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Design a shareable card to post on Threads, Instagram, or anywhere. Pick your style, theme, and content.
      </p>

      {/* ── Card Style ── */}
      <div>
        <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
          Card Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "availability", label: "Availability", desc: "Landscape · dates" },
            { id: "services",     label: "Services",     desc: "Square · price menu" },
            { id: "bold",         label: "Bold",         desc: "Portrait · big type" },
          ] as { id: CardStyle; label: string; desc: string }[]).map((s) => {
            const on = cardStyle === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCardStyle(s.id)}
                className="flex flex-col gap-0.5 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: on ? "var(--accent-light)" : "var(--bg-muted)",
                  border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <span className="text-xs font-black" style={{ color: on ? "var(--accent)" : "var(--text)" }}>
                  {s.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Theme ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          <Palette size={11} /> Theme
        </label>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: theme === t.id ? "var(--accent)" : "var(--bg-muted)",
                color: theme === t.id ? "white" : "var(--text-muted)",
                border: `1.5px solid ${theme === t.id ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              <span className="flex gap-0.5">
                {t.colors.map((c, i) => (
                  <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Background ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          Background
        </label>
        {/* Preset swatches grid */}
        <div className="grid grid-cols-6 gap-1.5 mb-2">
          {BG_PRESETS.map((p) => {
            const isSelected = bgPresetId === p.id;
            const isCustom = p.id === "custom";
            const gradStyle = p.c1 && p.c1 !== "custom"
              ? `linear-gradient(135deg, ${p.c1}, ${p.c2})`
              : p.id === "default"
                ? "linear-gradient(135deg, #13111e, #0d0b16)"
                : `linear-gradient(135deg, ${customC1}, ${customC2})`;
            return (
              <button
                key={p.id}
                onClick={() => setBgPresetId(p.id)}
                title={p.label}
                className="flex flex-col items-center gap-1 group"
              >
                <span
                  className="w-full h-8 rounded-lg transition-all"
                  style={{
                    background: gradStyle,
                    boxShadow: isSelected
                      ? "0 0 0 2px var(--accent), 0 0 0 4px var(--bg-card)"
                      : "0 0 0 1.5px var(--border)",
                  }}
                >
                  {isCustom && (
                    <span className="w-full h-full flex items-center justify-center text-white/60 text-base font-bold">+</span>
                  )}
                </span>
                <span
                  className="text-[9px] font-semibold truncate w-full text-center"
                  style={{ color: isSelected ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom color pickers */}
        {bgPresetId === "custom" && (
          <div className="flex gap-3 p-3 rounded-xl" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
            <div className="flex-1">
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Start color</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customC1}
                  onChange={(e) => setCustomC1(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  style={{ background: "none" }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--text)" }}>{customC1}</span>
              </div>
            </div>
            <div className="w-px self-stretch" style={{ background: "var(--border)" }} />
            <div className="flex-1">
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>End color</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customC2}
                  onChange={(e) => setCustomC2(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  style={{ background: "none" }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--text)" }}>{customC2}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Services ── */}
      {services.length > 0 && (
        <div>
          <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
            Services (max 4)
          </label>
          <div className="flex flex-col gap-1.5">
            {services.map((svc) => {
              const on = selectedServiceIds.has(svc.id);
              const atMax = selectedServiceIds.size >= 4 && !on;
              return (
                <button
                  key={svc.id}
                  onClick={() => !atMax && toggleService(svc.id)}
                  disabled={atMax}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all disabled:opacity-40"
                  style={{
                    background: on ? "var(--accent-light)" : "var(--bg-muted)",
                    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: on ? "var(--accent)" : "transparent",
                      border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {on && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                  </div>
                  <span className="text-xs font-semibold flex-1 truncate" style={{ color: "var(--text)" }}>{svc.title}</span>
                  <span className="text-xs font-black" style={{ color: "var(--accent)" }}>RM{svc.price}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dates ── */}
      {cardStyle === "availability" && upcomingDates.length > 0 && (
        <div>
          <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
            Dates (max 4)
          </label>
          <div className="flex flex-wrap gap-2">
            {upcomingDates.slice(0, 14).map((d, i) => {
              const on = selectedDateIdxs.has(i);
              const atMax = selectedDateIdxs.size >= 4 && !on;
              return (
                <button
                  key={i}
                  onClick={() => !atMax && toggleDate(i)}
                  disabled={atMax}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{
                    background: on ? "var(--accent)" : "var(--bg-muted)",
                    color: on ? "white" : "var(--text-muted)",
                    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Time Slots ── */}
      {cardStyle === "availability" && availableTimes.length > 0 && (
        <div>
          <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
            Time slots shown per date (max 6)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTimes.map((t) => {
              const on = selectedTimes.has(t);
              const atMax = selectedTimes.size >= 6 && !on;
              return (
                <button
                  key={t}
                  onClick={() => !atMax && toggleTime(t)}
                  disabled={atMax}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{
                    background: on ? "var(--accent)" : "var(--bg-muted)",
                    color: on ? "white" : "var(--text-muted)",
                    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {formatTime(t)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Preview
          </label>
          <button
            onClick={render}
            disabled={rendering}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
          >
            <RefreshCw size={11} className={rendering ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Canvas preview — full width, aspect-ratio preserved */}
        <div
          className="rounded-2xl overflow-hidden flex justify-center items-center p-3"
          style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              maxWidth: cardStyle === "services" ? CW_S : cardStyle === "bold" ? CW_B : CW_H,
              height: "auto",
              aspectRatio: cardStyle === "services" ? `${CW_S} / ${CH_S}` : cardStyle === "bold" ? `${CW_B} / ${CH_B}` : `${CW_H} / ${CH_H}`,
              borderRadius: 14,
              boxShadow: "0 6px 32px rgba(0,0,0,0.3)",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ── Download ── */}
      <button
        onClick={download}
        disabled={rendering || !profile.username}
        className="btn-primary w-full py-3.5 text-sm disabled:opacity-40"
      >
        <Download size={16} />
        Download card as PNG
      </button>

      {!profile.username && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Set a username in the Profile tab first.
        </p>
      )}
    </div>
  );
}
