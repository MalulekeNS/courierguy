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
import { Search, RefreshCw, ShieldCheck, UserCog, MailCheck, MailX, PhoneCall, PhoneOff, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [authInfo, setAuthInfo] = useState<Record<string, AuthInfo>>({});
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ title: string; description: string; tone?: "error" | "success" } | null>(null);
  const showAlert = (title: string, description: string, tone: "error" | "success" = "error") =>
    setAlertMsg({ title, description, tone });
  const [confirmAdd, setConfirmAdd] = useState<{
    userId: string;
    userName: string | null;
    email: string | null;
    hasProfile: boolean;
    role: AppRole;
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profs, error: pErr }, { data: roles, error: rErr }, { data: auths, error: aErr }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone, franchise_code, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.rpc("admin_list_users"),
    ]);
    if (pErr) toast({ title: "Failed to load users", description: pErr.message, variant: "destructive" });
    if (rErr) toast({ title: "Failed to load roles", description: rErr.message, variant: "destructive" });
    if (aErr) toast({ title: "Failed to load auth info", description: aErr.message, variant: "destructive" });

    setProfiles((profs ?? []) as ProfileRow[]);
    const map: Record<string, AppRole[]> = {};
    for (const r of (roles ?? []) as RoleRow[]) {
      (map[r.user_id] ||= []).push(r.role);
    }
    setRolesByUser(map);
    const aMap: Record<string, AuthInfo> = {};
    for (const a of ((auths ?? []) as AuthInfo[])) aMap[a.user_id] = a;
    setAuthInfo(aMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const a = authInfo[p.user_id];
      return (
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q) ||
        (p.franchise_code ?? "").toLowerCase().includes(q) ||
        p.user_id.toLowerCase().includes(q) ||
        (a?.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [profiles, search, authInfo]);

  const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  const performToggle = async (userId: string, role: AppRole, currently: boolean): Promise<boolean> => {
    setBusy(`${userId}:${role}`);
    let ok = false;
    if (currently) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) {
        toast({ title: "Could not remove role", description: error.message, variant: "destructive" });
      } else {
        setRolesByUser((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).filter((r) => r !== role) }));
        toast({ title: "Role removed", description: `${role}` });
        ok = true;
      }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) {
        toast({ title: "Could not add role", description: error.message, variant: "destructive" });
      } else {
        setRolesByUser((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), role] }));
        toast({ title: "Role added", description: `${role}` });
        ok = true;
      }
    }
    setBusy(null);
    return ok;
  };

  const toggleRole = async (userId: string, role: AppRole, currently: boolean) => {
    if (userId === me?.id && role === "admin" && currently) {
      showAlert("Action blocked", "You can't remove your own admin role.");
      return;
    }
    if (!currently && (role === "driver" || role === "franchisee")) {
      const a = authInfo[userId];
      const emailVerified = !!a?.email_confirmed_at;
      const phoneVerified = !!a?.phone_confirmed_at;
      if (!emailVerified) {
        showAlert(
          "Verification required",
          `Cannot assign "${role}" — this user must verify their email address first.`
        );
        return;
      }
      if (role === "driver" && !phoneVerified) {
        showAlert(
          "Verification required",
          `Cannot assign "driver" — this user must verify their phone number first.`
        );
        return;
      }
      const profile = profiles.find((p) => p.user_id === userId);
      setConfirmAdd({
        userId,
        userName: profile?.full_name?.trim() || null,
        email: a?.email ?? null,
        hasProfile: !!profile,
        role,
        emailVerified,
        phoneVerified,
      });
      return;
    }
    await performToggle(userId, role, currently);
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
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const userRoles = rolesByUser[p.user_id] ?? [];
                      const a = authInfo[p.user_id];
                      const emailVerified = !!a?.email_confirmed_at;
                      const phoneVerified = !!a?.phone_confirmed_at;
                      return (
                        <TableRow key={p.user_id}>
                          <TableCell>
                            <div className="font-medium">
                              {p.full_name || "—"}
                              {p.user_id === me?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">{p.user_id.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell className="text-sm">{a?.email || "—"}</TableCell>
                          <TableCell className="text-sm">{p.phone || a?.phone || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 text-xs ${emailVerified ? "text-success" : "text-muted-foreground"}`}
                                title={emailVerified ? `Email verified ${fmtDate(a?.email_confirmed_at)}` : "Email not verified"}
                              >
                                {emailVerified ? <MailCheck className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
                                Email
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs ${phoneVerified ? "text-success" : "text-muted-foreground"}`}
                                title={phoneVerified ? `Phone verified ${fmtDate(a?.phone_confirmed_at)}` : "Phone not verified"}
                              >
                                {phoneVerified ? <PhoneCall className="h-3 w-3" /> : <PhoneOff className="h-3 w-3" />}
                                Phone
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{fmtDate(a?.created_at ?? p.created_at)}</TableCell>
                          <TableCell className="text-sm">{p.franchise_code || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2">
                                {ALL_ROLES.map((role) => {
                                  const has = userRoles.includes(role);
                                  const id = `${p.user_id}:${role}`;
                                  const needsEmail = (role === "driver" || role === "franchisee") && !emailVerified;
                                  const needsPhone = role === "driver" && !phoneVerified;
                                  const blocked = !has && (needsEmail || needsPhone);
                                  const blockReason = needsEmail
                                    ? "Requires verified email"
                                    : needsPhone
                                    ? "Requires verified phone"
                                    : "";
                                  return (
                                    <button
                                      key={role}
                                      onClick={() => toggleRole(p.user_id, role, has)}
                                      disabled={busy === id}
                                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-opacity disabled:opacity-50 ${
                                        has
                                          ? roleColor[role]
                                          : blocked
                                          ? "bg-muted/50 text-muted-foreground/70 hover:bg-muted/60"
                                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                                      }`}
                                      title={blocked ? blockReason : has ? `Click to remove ${role}` : `Click to add ${role}`}
                                    >
                                      {has ? "✓ " : blocked ? "🔒 " : "+ "}{role}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="text-[11px] leading-snug space-y-0.5">
                                <div className={`inline-flex items-center gap-1 ${emailVerified ? "text-success" : "text-destructive"}`}>
                                  {emailVerified ? <MailCheck className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
                                  {emailVerified ? "Email confirmed" : "Email not confirmed — driver & franchisee locked"}
                                </div>
                                <div className={`flex items-center gap-1 ${phoneVerified ? "text-success" : "text-destructive"}`}>
                                  {phoneVerified ? <PhoneCall className="h-3 w-3" /> : <PhoneOff className="h-3 w-3" />}
                                  {phoneVerified ? "Phone confirmed" : "Phone not confirmed — driver locked"}
                                </div>
                              </div>
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

      <AlertDialog open={!!alertMsg} onOpenChange={(o) => !o && setAlertMsg(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${alertMsg?.tone === "success" ? "bg-success/10" : "bg-destructive/10"}`}>
              {alertMsg?.tone === "success"
                ? <ShieldCheck className="h-6 w-6 text-success" />
                : <AlertTriangle className="h-6 w-6 text-destructive" />}
            </div>
            <AlertDialogTitle className="text-center">{alertMsg?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">{alertMsg?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => setAlertMsg(null)} className="min-w-[100px]">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmAdd} onOpenChange={(o) => !o && setConfirmAdd(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Confirm {confirmAdd?.role} role
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center" asChild>
              <div>
                You're about to grant the{" "}
                <span className="font-semibold text-foreground">{confirmAdd?.role}</span> role to:
                <div className="mt-2 rounded-md border bg-muted/40 p-2 text-foreground text-left">
                  {confirmAdd?.userName ? (
                    <div className="font-semibold">{confirmAdd.userName}</div>
                  ) : (
                    <div className="font-semibold italic text-muted-foreground">No display name on file</div>
                  )}
                  <div className="text-sm text-muted-foreground break-all">
                    {confirmAdd?.email || "No email on record"}
                  </div>
                  {!confirmAdd?.hasProfile && (
                    <div className="mt-1 text-xs text-destructive">
                      ⚠ Profile not yet created — user hasn't completed onboarding.
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  This grants elevated access to operational data.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
            <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              Role eligibility — {confirmAdd?.role}
            </div>
            <div className={`flex items-center gap-2 ${confirmAdd?.emailVerified ? "text-success" : "text-destructive"}`}>
              {confirmAdd?.emailVerified ? <MailCheck className="h-4 w-4" /> : <MailX className="h-4 w-4" />}
              Email {confirmAdd?.emailVerified ? "confirmed" : "not confirmed"}
              <span className="ml-auto text-xs text-muted-foreground">required</span>
            </div>
            <div className={`flex items-center gap-2 ${confirmAdd?.phoneVerified ? "text-success" : "text-muted-foreground"}`}>
              {confirmAdd?.phoneVerified ? <PhoneCall className="h-4 w-4" /> : <PhoneOff className="h-4 w-4" />}
              Phone {confirmAdd?.phoneVerified ? "confirmed" : "not confirmed"}
              <span className="ml-auto text-xs text-muted-foreground">
                {confirmAdd?.role === "driver" ? "required" : "optional"}
              </span>
            </div>
            <div className="pt-1 text-xs text-muted-foreground border-t">
              {confirmAdd?.role === "driver"
                ? "Drivers need verified email and phone to receive job assignments."
                : "Franchisees need a verified email to manage branch operations."}
            </div>
          </div>

          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel className="min-w-[100px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-w-[140px]"
              onClick={async () => {
                if (!confirmAdd) return;
                const { userId, role, userName, email } = confirmAdd;
                const ok = await performToggle(userId, role, false);
                setConfirmAdd(null);
                if (ok) {
                  showAlert(
                    "Role assigned",
                    `${role.charAt(0).toUpperCase() + role.slice(1)} role granted to ${userName || email || "user"}.`,
                    "success"
                  );
                  load();
                }
              }}
            >
              Confirm & assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminUsers;
