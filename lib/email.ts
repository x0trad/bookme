import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "BookMe <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bookme-plum.vercel.app";

// ── Notify freelancer: new booking request ────────────────────
export async function sendNewBookingEmail({
  freelancerEmail,
  freelancerName,
  clientName,
  clientEmail,
  clientMessage,
  bookingDate,
  startTime,
  durationHours,
  serviceTitle,
}: {
  freelancerEmail: string;
  freelancerName: string;
  clientName: string;
  clientEmail: string;
  clientMessage?: string | null;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
}) {
  const dateLabel = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h] = startTime.split(":").map(Number);
  const endH = h + durationHours;
  const fmt = (hr: number) => `${hr % 12 || 12}:00 ${hr >= 12 ? "PM" : "AM"}`;

  await resend.emails.send({
    from: FROM,
    to: freelancerEmail,
    subject: `New booking request from ${clientName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#7c3aed;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">New Booking Request</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Someone wants to book a session with you</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b6880;width:120px">From</td><td style="padding:8px 0;font-weight:600">${clientName} (${clientEmail})</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Date</td><td style="padding:8px 0;font-weight:600">${dateLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Time</td><td style="padding:8px 0;font-weight:600">${fmt(h)} – ${fmt(endH)} (${durationHours}h)</td></tr>
            ${serviceTitle ? `<tr><td style="padding:8px 0;color:#6b6880">Service</td><td style="padding:8px 0;font-weight:600">${serviceTitle}</td></tr>` : ""}
            ${clientMessage ? `<tr><td style="padding:8px 0;color:#6b6880;vertical-align:top">Message</td><td style="padding:8px 0;font-style:italic">"${clientMessage}"</td></tr>` : ""}
          </table>
          <div style="margin-top:24px">
            <a href="${APP_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Review in Dashboard →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">You're receiving this because a client booked via your BookMe page.</p>
        </div>
      </div>
    `,
  });
}

// ── Notify client: booking approved ──────────────────────────
export async function sendBookingApprovedEmail({
  clientEmail,
  clientName,
  freelancerName,
  freelancerUsername,
  bookingDate,
  startTime,
  durationHours,
  serviceTitle,
}: {
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  freelancerUsername: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
}) {
  const dateLabel = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h] = startTime.split(":").map(Number);
  const endH = h + durationHours;
  const fmt = (hr: number) => `${hr % 12 || 12}:00 ${hr >= 12 ? "PM" : "AM"}`;

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Your booking with ${freelancerName} is confirmed!`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#7c3aed;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Booking Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Your session has been approved</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 20px;font-size:15px">Hi ${clientName}, great news — <strong>${freelancerName}</strong> has approved your booking.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b6880;width:120px">With</td><td style="padding:8px 0;font-weight:600">${freelancerName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Date</td><td style="padding:8px 0;font-weight:600">${dateLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Time</td><td style="padding:8px 0;font-weight:600">${fmt(h)} – ${fmt(endH)} (${durationHours}h)</td></tr>
            ${serviceTitle ? `<tr><td style="padding:8px 0;color:#6b6880">Service</td><td style="padding:8px 0;font-weight:600">${serviceTitle}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px">
            <a href="${APP_URL}/u/${freelancerUsername}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View Profile →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">BookMe — simple booking for people with skills to share.</p>
        </div>
      </div>
    `,
  });
}

// ── Notify client: booking rejected ──────────────────────────
export async function sendBookingRejectedEmail({
  clientEmail,
  clientName,
  freelancerName,
  freelancerUsername,
  bookingDate,
  startTime,
}: {
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  freelancerUsername: string;
  bookingDate: string;
  startTime: string;
}) {
  const dateLabel = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h] = startTime.split(":").map(Number);
  const fmt = (hr: number) => `${hr % 12 || 12}:00 ${hr >= 12 ? "PM" : "AM"}`;

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Update on your booking with ${freelancerName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#6b6880;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Booking Update</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Regarding your session request</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px;font-size:15px">Hi ${clientName}, unfortunately <strong>${freelancerName}</strong> is unable to accept your booking for <strong>${dateLabel} at ${fmt(h)}</strong>.</p>
          <p style="font-size:14px;color:#6b6880">You're welcome to check their availability and pick another time.</p>
          <div style="margin-top:24px">
            <a href="${APP_URL}/u/${freelancerUsername}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              See other availability →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">BookMe — simple booking for people with skills to share.</p>
        </div>
      </div>
    `,
  });
}
