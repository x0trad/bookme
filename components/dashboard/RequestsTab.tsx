"use client";
import { useState, useTransition } from "react";
import { BookingRequest } from "@/types";
import { updateBookingStatus } from "@/app/dashboard/actions";
import { Clock, CheckCircle2, XCircle, Inbox, Calendar, Mail, MessageSquare } from "lucide-react";
import { formatTime } from "@/lib/utils";

const STATUS_STYLES = {
  pending:  { bg: "bg-yellow-500/10", text: "text-yellow-500",  label: "Pending"  },
  approved: { bg: "bg-green-500/10",  text: "text-green-500",   label: "Approved" },
  rejected: { bg: "bg-red-500/10",    text: "text-red-500",     label: "Rejected" },
};

export function RequestsTab({ requests }: { requests: BookingRequest[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [pending, startTransition] = useTransition();

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  function handleStatus(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      await updateBookingStatus(id, status);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["pending", "all", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={
              filter === f
                ? { background: "var(--accent)", color: "white" }
                : { background: "var(--bg-muted)", color: "var(--text-muted)" }
            }
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <Inbox size={32} style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>No {filter} requests</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Booking requests from clients will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => {
            const s = STATUS_STYLES[req.status];
            const endHour = Number(req.start_time.split(":")[0]) + req.duration_hours;
            const endTime = `${String(Math.floor(endHour)).padStart(2,"0")}:${String(Math.round((endHour % 1) * 60)).padStart(2,"0")}`;

            return (
              <div key={req.id} className="card p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      {req.client_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail size={11} style={{ color: "var(--text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{req.client_email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    {s.label}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={12} />
                    <span>{new Date(req.booking_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Clock size={12} />
                    <span>{formatTime(req.start_time)} – {formatTime(endTime)}</span>
                  </div>
                </div>

                {/* Service */}
                {req.service_offerings && (
                  <div
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {(req.service_offerings as unknown as {title: string}).title}
                  </div>
                )}

                {/* Message */}
                {req.client_message && (
                  <div className="flex gap-1.5 items-start" style={{ color: "var(--text-muted)" }}>
                    <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed italic">&ldquo;{req.client_message}&rdquo;</p>
                  </div>
                )}

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleStatus(req.id, "approved")}
                      disabled={pending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      onClick={() => handleStatus(req.id, "rejected")}
                      disabled={pending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
