import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, MapPin, Truck, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Shipment {
  id: string;
  waybill_number: string;
  receiver_name: string;
  receiver_suburb: string;
  service_name: string;
  status: string;
  price_zar: number;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline"; cls: string }> = {
  pending_payment: { label: "Pending Payment", icon: Clock, variant: "outline", cls: "text-warning" },
  booked: { label: "Booked", icon: Package, variant: "secondary", cls: "" },
  awaiting_pickup: { label: "Awaiting Pickup", icon: Clock, variant: "outline", cls: "" },
  collected: { label: "Collected", icon: Truck, variant: "secondary", cls: "" },
  in_transit: { label: "In Transit", icon: Truck, variant: "default", cls: "" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, variant: "default", cls: "" },
  delivered: { label: "Delivered", icon: CheckCircle2, variant: "default", cls: "text-success" },
  failed_delivery: { label: "Failed Delivery", icon: AlertTriangle, variant: "destructive", cls: "" },
  cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive", cls: "" },
};

const Dashboard = () => {
  const { user, roles } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shipments")
        .select("id, waybill_number, receiver_name, receiver_suburb, service_name, status, price_zar, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) console.error(error);
      setShipments(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => ["collected", "in_transit", "out_for_delivery"].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back. Roles: {roles.length ? roles.join(", ") : "customer"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/book">
              <Button variant="accent" className="gap-2"><Plus className="h-4 w-4" />Book Shipment</Button>
            </Link>
            <Link to="/quote"><Button variant="outline">Get Quote</Button></Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Shipments" value={stats.total} icon={Package} />
          <StatCard title="In Transit" value={stats.inTransit} icon={Truck} />
          <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Shipments</CardTitle>
            <CardDescription>Your last 50 shipments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12"><LoadingSpinner size="md" text="Loading shipments..." /></div>
            ) : shipments.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No shipments yet</p>
                <Link to="/book"><Button variant="accent" className="mt-4 gap-2"><Plus className="h-4 w-4" />Book your first shipment</Button></Link>
              </div>
            ) : (
              <div className="divide-y">
                {shipments.map((s) => {
                  const meta = STATUS_META[s.status] ?? STATUS_META.booked;
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={s.id}
                      to={`/track?n=${encodeURIComponent(s.waybill_number)}`}
                      className="flex items-center justify-between gap-4 py-4 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold">{s.waybill_number}</span>
                          <Badge variant={meta.variant} className={meta.cls}>
                            <Icon className="mr-1 h-3 w-3" />{meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          To {s.receiver_name} • <MapPin className="inline h-3 w-3" /> {s.receiver_suburb} • {s.service_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R {s.price_zar.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Package }) => (
  <Card className="shadow-card">
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
