import { useEffect, useState, startTransition } from "react";
import { UserRole } from "~/types";

type Invitation = {
  id: string;
  code: string;
  email: string | null;
  role: string;
  isUsed: boolean;
  createdAt: string;
};

export function InvitationManager({ user }: { user: { role: string } }) {
  const [list, setList] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const isBusinessAdmin = user?.role === UserRole.BUSINESS_ADMIN;
  const roleOptions = isBusinessAdmin ? [UserRole.INDIVIDUAL, UserRole.BUSINESS_STAFF] : Object.values(UserRole);
  const [role, setRole] = useState<string>(roleOptions[0]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/invitations");
    if (res.ok) {
      const data = await res.json() as Invitation[];
      setList(data);
    }
  };
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const res = await fetch("/api/admin/invitations", { signal: ac.signal });
      if (res.ok) {
        const data = await res.json() as Invitation[];
        startTransition(() => setList(data));
      }
    })();
    return () => ac.abort();
  }, []);

  const create = async () => {
    setLoading(true);
    if (role === UserRole.BUSINESS_ADMIN && !email) {
      alert("Email is required when inviting a BUSINESS_ADMIN.");
      setLoading(false);
      return;
    }
    await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || null, role, code: code || undefined }),
    });
    setEmail("");
    setCode("");
    await load();
    setLoading(false);
  };

  const remove = async (id: string) => {
    setLoading(true);
    await fetch(`/api/admin/invitations?id=${id}`, { method: "DELETE" });
    await load();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-3">
        <input placeholder="Email (optional)" className="border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input placeholder="Code (optional)" className="border rounded px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
        <button disabled={loading} className="px-4 py-2 rounded bg-slate-900 text-white" onClick={create}>
          Create Invitation
        </button>
      </div>

      <div className="overflow-x-auto border rounded-xl bg-white/50">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Used</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3">{inv.code}</td>
                <td className="p-3">{inv.email ?? ""}</td>
                <td className="p-3">{inv.role}</td>
                <td className="p-3">{inv.isUsed ? "Yes" : "No"}</td>
                <td className="p-3 text-right">
                  <button disabled={loading} className="px-3 py-1 rounded border" onClick={() => remove(inv.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
