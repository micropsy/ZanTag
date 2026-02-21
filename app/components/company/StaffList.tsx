"use client"; // Remix is always server/client, this directive is ignored;
import { useState } from "react";

export function StaffList({ profiles }: { profiles: { id: string; slug: string | null; user: { name: string | null; email: string | null } | null; isLockedByAdmin: boolean }[] }) {
  const [rows, setRows] = useState(profiles);
  const toggle = async (id: string, locked: boolean) => {
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, isLockedByAdmin: locked } : p)));
    await fetch("/api/company/staff/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id, locked }),
    });
  };
  return (
    <div className="overflow-x-auto border rounded-xl bg-white/50">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Slug</th>
            <th className="p-3 text-left">Locked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.user?.name ?? ""}</td>
              <td className="p-3">{p.user?.email ?? ""}</td>
              <td className="p-3">{p.slug ?? ""}</td>
              <td className="p-3">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={p.isLockedByAdmin} onChange={(e) => toggle(p.id, e.target.checked)} />
                  <span>{p.isLockedByAdmin ? "Locked" : "Unlocked"}</span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
