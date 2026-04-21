import { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Search, UserCheck, ListPlus, RefreshCw, Truck, Building2, ShieldCheck } from "lucide-react";

type ShipStatus =
  | "pending_payment" | "booked" | "awaiting_pickup" | "collected"
  | "in_transit" | "out_for_delivery" | "delivered" | "failed_delivery" | "cancelled";

interface ShipmentRow {
  id: string;
  waybill_number: string;
  status: ShipStatus;
  service_name: string;
  price_zar: number;
  weight_kg: number;
  sender_name: string;
  sender_suburb: string;
  sender_franchise_code: string;
  receiver_name: string;
  receiver_suburb: string;
  receiver_postal_code: string;
  receiver_franchise_code: string | null;
  assigned_driver_id: string | null;
  customer_id: string;
  created_at: string;
}

interface Driver {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  franchise_code: string | null;
}

const STATUS_OPTIONS: { value: ShipStatus; label: string }[] = [
  { value: "booked", label: "Booked" },
  { value: "awaiting_pickup", label: "Awaiting Pickup" },
  { value: "collected", label: "Collected" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed_delivery", label: "Failed Delivery" },
  { value: "cancelled", label: "Cancelled" },
];

const statusVariant = (s: ShipStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "delivered") return "default";
  if (s === "failed_delivery" || s === "cancelled") return "destructive";
  if (s === "in_transit" || s === "out_for_delivery") return "default";
  return "secondary";
};

const Operations = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isFranchisee = roles.includes("franchisee");

  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [active, setActive] = useState<ShipmentRow | null>(null);
  const [eventStatus, setEventStatus] = useState<ShipStatus>("collected");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: shipData, error: shipErr }, { data: roleData, error: roleErr }] = await Promise.all([
      supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
    ]);

    if (shipErr) {
      toast({ title: "Failed to load shipments", description: shipErr.message, variant: "destructive" });
    } else {
      setShipments((shipData ?? []) as ShipmentRow[]);
    }

    if (roleErr) {
      console.error(roleErr);
    } else {
      const driverIds = (roleData ?? []).map((r) => r.user_id);
      if (driverIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, franchise_code")
          .in("user_id", driverIds);
        setDrivers((profs ?? []) as Driver[]);
      } else {
        setDrivers([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleDrivers = useMemo(() => {
    if (isAdmin) return drivers;
    if (!active) return drivers;
    const code = active.sender_franchise_code;
    return drivers.filter((d) => !d.franchise_code || d.franchise_code === code);
  }, [drivers, isAdmin, active]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.waybill_number.toLowerCase().includes(q) ||
        s.receiver_name.toLowerCase().includes(q) ||
        s.sender_name.toLowerCase().includes(q) ||
        s.receiver_suburb.toLowerCase().includes(q) ||
        s.sender_suburb.toLowerCase().includes(q)
      );
    });
  }, [shipments, search, statusFilter]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const unassigned = shipments.filter((s) => !s.assigned_driver_id && s.status !== "delivered" && s.status !== "cancelled").length;
    const inTransit = shipments.filter((s) => ["collected", "in_transit", "out_for_delivery"].includes(s.status)).length;
    const delivered = shipments.filter((s) => s.status === "delivered").length;
    return { total, unassigned, inTransit, delivered };
  }, [shipments]);

  const assignDriver = async (driverId: string) => {
    if (!active) return;
    setSavingDriver(true);
    const { error } = await supabase
      .from("shipments")
      .update({ assigned_driver_id: driverId })
      .eq("id", active.id);
    setSavingDriver(false);
    if (error) {
      toast({ title: "Could not assign driver", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Driver assigned", description: `Waybill ${active.waybill_number}` });
    setShipments((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, assigned_driver_id: driverId } : s)),
    );
    setActive((s) => (s ? { ...s, assigned_driver_id: driverId } : s));
  };

  const addEvent = async () => {
    if (!active || !user) return;
    if (!eventDescription.trim()) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    setSavingEvent(true);
    const { error } = await supabase.from("shipment_events").insert({
      shipment_id: active.id,
      status: eventStatus,
      description: eventDescription.trim(),
      location: eventLocation.trim() || null,
      recorded_by: user.id,
    });
    setSavingEvent(false);
    if (error) {
      toast({ title: "Could not add event", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Event recorded", description: `${active.waybill_number} → ${eventStatus}` });
    setShipments((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, status: eventStatus } : s)),
    );
    setActive((s) => (s ? { ...s, status: eventStatus } : s));
    setEventDescription("");
    setEventLocation("");
  };

  if (!isAdmin && !isFranchisee) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>You need an admin or franchisee role to view operations.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Operations</h1>
            <p className="text-muted-foreground">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Admin view — all branches</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> Branch view — your franchise</span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total shipments" value={stats.total} />
          <StatCard label="Unassigned" value={stats.unassigned} accent />
          <StatCard label="In transit" value={stats.inTransit} />
          <StatCard label="Delivered" value={stats.delivered} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <CardDescription>Assign drivers, update status, and record events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search waybill, sender, receiver, suburb…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-12"><LoadingSpinner size="lg" text="Loading shipments..." /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No shipments match your filters.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waybill</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
                      const driver = drivers.find((d) => d.user_id === s.assigned_driver_id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.waybill_number}</TableCell>
                          <TableCell className="text-sm">
                            {s.sender_franchise_code} → {s.receiver_franchise_code ?? s.receiver_postal_code}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{s.receiver_name}</div>
                            <div className="text-xs text-muted-foreground">{s.receiver_suburb}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(s.status)}>
                              {STATUS_OPTIONS.find((o) => o.value === s.status)?.label ?? s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {driver ? (
                              <span className="inline-flex items-center gap-1">
                                <Truck className="h-3 w-3" /> {driver.full_name ?? "Driver"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => { setActive(s); setEventStatus(s.status); }}>
                              Manage
                            </Button>
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

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{active.waybill_number}</DialogTitle>
                <DialogDescription>
                  {active.sender_name} ({active.sender_suburb}) → {active.receiver_name} ({active.receiver_suburb})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold"><UserCheck className="h-4 w-4" /> Assign driver</h3>
                  <div className="flex gap-2">
                    <Select
                      value={active.assigned_driver_id ?? ""}
                      onValueChange={assignDriver}
                      disabled={savingDriver}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleDrivers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No drivers available</div>
                        ) : visibleDrivers.map((d) => (
                          <SelectItem key={d.user_id} value={d.user_id}>
                            {d.full_name ?? "Driver"} {d.franchise_code ? `· ${d.franchise_code}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold"><ListPlus className="h-4 w-4" /> Record event</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={eventStatus} onValueChange={(v) => setEventStatus(v as ShipStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Location (optional)"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                    />
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Description (e.g. 'Collected from sender')"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                  />
                </section>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
                <Button onClick={addEvent} disabled={savingEvent}>
                  {savingEvent ? "Saving..." : "Add event & update status"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${accent ? "text-accent" : "text-primary"}`}>
        {value}
      </div>
    </CardContent>
  </Card>
);

export default Operations;
