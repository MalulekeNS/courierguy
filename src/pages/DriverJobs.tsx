import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Truck, MapPin, Phone, Package, RefreshCw } from "lucide-react";

type ShipStatus =
  | "collected" | "in_transit" | "out_for_delivery"
  | "delivered" | "failed_delivery";

interface Job {
  id: string;
  waybill_number: string;
  status: string;
  service_name: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_street: string;
  receiver_suburb: string;
  receiver_postal_code: string;
  sender_name: string;
  sender_suburb: string;
  weight_kg: number;
  parcel_description: string | null;
}

const DRIVER_STATUS: { value: ShipStatus; label: string }[] = [
  { value: "collected", label: "Collected from sender" },
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed_delivery", label: "Failed delivery" },
];

const DriverJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Record<string, { status: ShipStatus; location: string; note: string; saving: boolean }>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("shipments")
      .select("id, waybill_number, status, service_name, receiver_name, receiver_phone, receiver_street, receiver_suburb, receiver_postal_code, sender_name, sender_suburb, weight_kg, parcel_description")
      .eq("assigned_driver_id", user.id)
      .not("status", "in", '("delivered","cancelled")')
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Could not load jobs", description: error.message, variant: "destructive" });
    } else {
      setJobs((data ?? []) as Job[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setUpdate = (id: string, patch: Partial<{ status: ShipStatus; location: string; note: string; saving: boolean }>) => {
    setUpdates((prev) => ({
      ...prev,
      [id]: {
        status: prev[id]?.status ?? "collected",
        location: prev[id]?.location ?? "",
        note: prev[id]?.note ?? "",
        saving: prev[id]?.saving ?? false,
        ...patch,
      },
    }));
  };

  const submit = async (job: Job) => {
    if (!user) return;
    const u = updates[job.id];
    if (!u || !u.note.trim()) {
      toast({ title: "Add a short note", description: "e.g. 'Picked up at reception'", variant: "destructive" });
      return;
    }
    setUpdate(job.id, { saving: true });
    const { error } = await supabase.from("shipment_events").insert({
      shipment_id: job.id,
      status: u.status,
      description: u.note.trim(),
      location: u.location.trim() || null,
      recorded_by: user.id,
    });
    setUpdate(job.id, { saving: false });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated", description: `${job.waybill_number} → ${u.status}` });
    setUpdate(job.id, { note: "", location: "" });
    load();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">My Jobs</h1>
            <p className="text-muted-foreground">Pickups and deliveries assigned to you.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner size="lg" text="Loading jobs..." /></div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active jobs assigned. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const u = updates[job.id] ?? { status: "collected" as ShipStatus, location: "", note: "", saving: false };
              return (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="font-mono text-base">{job.waybill_number}</CardTitle>
                        <CardDescription>{job.service_name} · {job.weight_kg} kg</CardDescription>
                      </div>
                      <Badge variant="secondary">{job.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border p-3">
                        <div className="mb-1 text-xs uppercase text-muted-foreground">Pickup</div>
                        <div className="font-medium">{job.sender_name}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />{job.sender_suburb}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="mb-1 text-xs uppercase text-muted-foreground">Deliver to</div>
                        <div className="font-medium">{job.receiver_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.receiver_street}, {job.receiver_suburb} {job.receiver_postal_code}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${job.receiver_phone}`} className="text-primary hover:underline">{job.receiver_phone}</a>
                        </div>
                      </div>
                    </div>

                    {job.parcel_description && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Package className="mt-0.5 h-4 w-4" /> {job.parcel_description}
                      </div>
                    )}

                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Truck className="h-4 w-4" /> Update status
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Select value={u.status} onValueChange={(v) => setUpdate(job.id, { status: v as ShipStatus })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DRIVER_STATUS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Location (optional)"
                          value={u.location}
                          onChange={(e) => setUpdate(job.id, { location: e.target.value })}
                        />
                      </div>
                      <Textarea
                        placeholder="Note (e.g. 'Delivered to reception, signed by J. Smith')"
                        value={u.note}
                        onChange={(e) => setUpdate(job.id, { note: e.target.value })}
                      />
                      <div className="flex justify-end">
                        <Button onClick={() => submit(job)} disabled={u.saving}>
                          {u.saving ? "Saving..." : "Submit update"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DriverJobs;
