"use client";
import { useState, useTransition } from "react";
import { ServiceOffering } from "@/types";
import { addService, deleteService } from "@/app/dashboard/actions";
import { Plus, Trash2, Clock, Briefcase } from "lucide-react";

export function ServicesTab({
  services,
  profileId,
}: {
  services: ServiceOffering[];
  profileId: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await addService(fd);
      if (res?.error) { setError(res.error); return; }
      form.reset();
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteService(id); });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          disabled={!profileId}
          className="btn-primary w-full disabled:opacity-50"
          title={!profileId ? "Set up your profile first" : undefined}
        >
          <Plus size={16} /> Add service
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 flex flex-col gap-3 animate-slide-up">
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>New service</h3>
          <input required name="title" placeholder="Service title" className="input-base" />
          <textarea name="description" placeholder="Short description (optional)" className="input-base resize-none h-20" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>Duration (hours)</label>
              <input required type="number" name="duration_hours" min="0.5" max="24" step="0.5" defaultValue="1" className="input-base" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>Price (RM)</label>
              <input required type="number" name="price" min="0" step="1" placeholder="150" className="input-base" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? "Saving…" : "Save service"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      )}

      {/* List */}
      {services.length === 0 && !showForm ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <Briefcase size={32} style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>No services yet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add the services you offer — clients will see them on your booking page.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((s) => (
            <div key={s.id} className="card p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                <Briefcase size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.title}</p>
                {s.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{s.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    RM {s.price}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Clock size={11} />{s.duration_hours}h
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={pending}
                className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
