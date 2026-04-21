import { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Search, RefreshCw, ShieldCheck, UserCog, MailCheck, MailX, PhoneCall, PhoneOff } from "lucide-react";

const ALL_ROLES: AppRole[] = ["customer", "driver", "franchisee", "admin"];

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  franchise_code: string | null;
  created_at: string;
}

interface AuthInfo {
  user_id: string;
  email: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: AppRole;
}

const roleColor: Record<AppRole, string> = {
  admin: "bg-destructive text-destructive-foreground",
  franchisee: "bg-primary text-primary-foreground",
  driver: "bg-accent text-accent-foreground",
  customer: "bg-secondary text-secondary-foreground",
};

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profs, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone, franchise_code, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) toast({ title: "Failed to load users", description: pErr.message, variant: "destructive" });
    if (rErr) toast({ title: "Failed to load roles", description: rErr.message, variant: "destructive" });

    setProfiles((profs ?? []) as ProfileRow[]);
    const map: Record<string, AppRole[]> = {};
    for (const r of (roles ?? []) as RoleRow[]) {
      (map[r.user_id] ||= []).push(r.role);
    }
    setRolesByUser(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      (p.full_name ?? "").toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q) ||
      (p.franchise_code ?? "").toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const toggleRole = async (userId: string, role: AppRole, currently: boolean) => {
    if (userId === me?.id && role === "admin" && currently) {
      toast({ title: "Blocked", description: "You can't remove your own admin role.", variant: "destructive" });
      return;
    }
    setBusy(`${userId}:${role}`);
    if (currently) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) {
        toast({ title: "Could not remove role", description: error.message, variant: "destructive" });
      } else {
        setRolesByUser((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).filter((r) => r !== role) }));
        toast({ title: "Role removed", description: `${role}` });
      }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) {
        toast({ title: "Could not add role", description: error.message, variant: "destructive" });
      } else {
        setRolesByUser((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), role] }));
        toast({ title: "Role added", description: `${role}` });
      }
    }
    setBusy(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary inline-flex items-center gap-2">
              <UserCog className="h-7 w-7" /> User & Role Management
            </h1>
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Admin only — assign or revoke roles per user.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>Click a role chip to toggle it for that user.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, franchise, user id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="py-12"><LoadingSpinner size="lg" text="Loading users..." /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const userRoles = rolesByUser[p.user_id] ?? [];
                      return (
                        <TableRow key={p.user_id}>
                          <TableCell>
                            <div className="font-medium">
                              {p.full_name || "—"}
                              {p.user_id === me?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">{p.user_id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                          <TableCell className="text-sm">{p.franchise_code || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {ALL_ROLES.map((role) => {
                                const has = userRoles.includes(role);
                                const id = `${p.user_id}:${role}`;
                                return (
                                  <button
                                    key={role}
                                    onClick={() => toggleRole(p.user_id, role, has)}
                                    disabled={busy === id}
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-opacity disabled:opacity-50 ${
                                      has ? roleColor[role] : "bg-muted text-muted-foreground hover:bg-muted/70"
                                    }`}
                                    title={has ? `Click to remove ${role}` : `Click to add ${role}`}
                                  >
                                    {has ? "✓ " : "+ "}{role}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminUsers;
