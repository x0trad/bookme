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

// ── Notify client: request received (with manage link) ───────
export async function sendBookingReceivedEmail({
  clientEmail,
  clientName,
  freelancerName,
  bookingDate,
  startTime,
  durationHours,
  serviceTitle,
  manageToken,
}: {
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
  manageToken: string;
}) {
  const dateLabel = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h] = startTime.split(":").map(Number);
  const endH = h + durationHours;
  const fmt = (hr: number) => `${hr % 12 || 12}:00 ${hr >= 12 ? "PM" : "AM"}`;
  const manageUrl = `${APP_URL}/booking/${manageToken}`;

  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Your booking request with ${freelancerName} was sent`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#7c3aed;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Request Sent</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">We'll let you know once it's approved</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 20px;font-size:15px">Hi ${clientName}, your booking request with <strong>${freelancerName}</strong> is in.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b6880;width:120px">Date</td><td style="padding:8px 0;font-weight:600">${dateLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Time</td><td style="padding:8px 0;font-weight:600">${fmt(h)} – ${fmt(endH)} (${durationHours}h)</td></tr>
            ${serviceTitle ? `<tr><td style="padding:8px 0;color:#6b6880">Service</td><td style="padding:8px 0;font-weight:600">${serviceTitle}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px">
            <a href="${manageUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View, reschedule, or cancel →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">Keep this email — the link above is your key to managing this booking. No account needed.</p>
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
  manageToken,
}: {
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  freelancerUsername: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
  manageToken?: string | null;
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
            ${manageToken ? `<a href="${APP_URL}/booking/${manageToken}" style="display:inline-block;margin-left:8px;background:#fff;color:#7c3aed;border:1px solid #7c3aed;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Manage booking
            </a>` : ""}
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

// ── Notify freelancer: client cancelled ──────────────────────
export async function sendBookingCancelledEmail({
  freelancerEmail,
  freelancerName,
  clientName,
  bookingDate,
  startTime,
  durationHours,
  serviceTitle,
}: {
  freelancerEmail: string;
  freelancerName: string;
  clientName: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
}) {
  const dateLabel = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h] = startTime.split(":").map(Number);
  const fmt = (hr: number) => `${hr % 12 || 12}:00 ${hr >= 12 ? "PM" : "AM"}`;

  await resend.emails.send({
    from: FROM,
    to: freelancerEmail,
    subject: `${clientName} cancelled their booking`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#6b6880;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Booking Cancelled</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">A client cancelled their session</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px;font-size:15px">Hi ${freelancerName}, <strong>${clientName}</strong> cancelled their booking${serviceTitle ? ` for <strong>${serviceTitle}</strong>` : ""} on <strong>${dateLabel} at ${fmt(h)}</strong> (${durationHours}h).</p>
          <p style="font-size:14px;color:#6b6880">That slot is now open for other clients.</p>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">You're receiving this because of a change to a booking on your BookMe page.</p>
        </div>
      </div>
    `,
  });
}

// ── Notify freelancer: client rescheduled ────────────────────
export async function sendBookingRescheduledEmail({
  freelancerEmail,
  freelancerName,
  clientName,
  bookingDate,
  startTime,
  durationHours,
  serviceTitle,
  previousDate,
  previousTime,
}: {
  freelancerEmail: string;
  freelancerName: string;
  clientName: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  serviceTitle?: string | null;
  previousDate: string;
  previousTime: string;
}) {
  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-MY", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  const fmtHour = (t: string) => {
    const [h] = t.split(":").map(Number);
    return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
  };

  await resend.emails.send({
    from: FROM,
    to: freelancerEmail,
    subject: `${clientName} rescheduled — needs your approval`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f0e17">
        <div style="background:#7c3aed;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Booking Rescheduled</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">The new time needs your approval</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e4e2f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 20px;font-size:15px">Hi ${freelancerName}, <strong>${clientName}</strong> moved their booking${serviceTitle ? ` for <strong>${serviceTitle}</strong>` : ""}.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b6880;width:120px">Was</td><td style="padding:8px 0;text-decoration:line-through;color:#9391a8">${fmtDate(previousDate)} at ${fmtHour(previousTime)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6880">Now</td><td style="padding:8px 0;font-weight:600">${fmtDate(bookingDate)} at ${fmtHour(startTime)} (${durationHours}h)</td></tr>
          </table>
          <div style="margin-top:24px">
            <a href="${APP_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Review in Dashboard →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#9391a8">The booking is back to pending until you approve the new time.</p>
        </div>
      </div>
    `,
  });
}
