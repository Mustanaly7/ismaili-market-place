import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { listAllUsers } from "@/server/admin";
import { toggleSuspendUserAction } from "@/server/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const users = await listAllUsers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Users</h1>
      <p className="text-lg text-stone-600">Everyone who has joined the marketplace.</p>
      <div className="mt-4">
        <Alert type="success" message={ok} />
        <Alert type="error" message={error} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead className="border-b border-stone-200 bg-stone-50 text-base text-stone-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="text-base">
                <td className="px-4 py-3 font-semibold text-stone-900">{u.name || "—"}</td>
                <td className="px-4 py-3 text-stone-600">{u.email || u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "admin" ? "brand" : u.role === "seller" ? "accent" : "neutral"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-stone-600">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {u.suspended ? <Badge tone="danger">Suspended</Badge> : <Badge tone="success">Active</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role === "admin" ? (
                    <span className="text-sm text-stone-400">—</span>
                  ) : (
                    <form action={toggleSuspendUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <Button type="submit" size="sm" variant={u.suspended ? "subtle" : "danger"}>
                        {u.suspended ? "Reinstate" : "Suspend"}
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}