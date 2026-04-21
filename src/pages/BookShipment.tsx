import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Package, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuoteCache, QuoteParams, QuoteService } from "@/hooks/useQuoteCache";

const RF_CODE = "JNB";

const partySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  street: z.string().trim().min(2).max(200),
  suburb: z.string().trim().min(2).max(100),
  postal_code: z.string().trim().regex(/^\d{4}$/, "Postal code must be 4 digits"),
});

const parcelSchema = z.object({
  weight_kg: z.coerce.number().positive().max(100),
  description: z.string().trim().max(200).optional(),
});

const BookShipment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sender, setSender] = useState({ name: "", phone: "", street: "", suburb: "", postal_code: "" });
  const [receiver, setReceiver] = useState({ name: "", phone: "", street: "", suburb: "", postal_code: "" });
  const [parcel, setParcel] = useState({ weight_kg: "", description: "" });
  const [quoteParams, setQuoteParams] = useState<QuoteParams | null>(null);
  const [chosen, setChosen] = useState<QuoteService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: quote, isLoading: quoting, error: quoteError } = useQuoteCache(quoteParams);

  const goNext = () => {
    if (step === 1) {
      const r = partySchema.safeParse(sender);
      if (!r.success) { toast.error("Sender: " + r.error.errors[0].message); return; }
    }
    if (step === 2) {
      const r = partySchema.safeParse(receiver);
      if (!r.success) { toast.error("Receiver: " + r.error.errors[0].message); return; }
    }
    if (step === 3) {
      const r = parcelSchema.safeParse({ weight_kg: parcel.weight_kg, description: parcel.description });
      if (!r.success) { toast.error("Parcel: " + r.error.errors[0].message); return; }
      setQuoteParams({
        suburb: receiver.suburb,
        postalCode: receiver.postal_code,
        weight: parcel.weight_kg,
        rfCode: RF_CODE,
      });
      setChosen(null);
    }
    setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const handleConfirm = async () => {
    if (!user || !chosen) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("shipments").insert({
        customer_id: user.id,
        waybill_number: "", // trigger will fill
        sender_name: sender.name,
        sender_phone: sender.phone,
        sender_street: sender.street,
        sender_suburb: sender.suburb,
        sender_postal_code: sender.postal_code,
        sender_franchise_code: RF_CODE,
        receiver_name: receiver.name,
        receiver_phone: receiver.phone,
        receiver_street: receiver.street,
        receiver_suburb: receiver.suburb,
        receiver_postal_code: receiver.postal_code,
        receiver_franchise_code: quote?.delfranchise ?? null,
        weight_kg: parseFloat(parcel.weight_kg),
        service_name: chosen.name,
        service_type: chosen.type ?? null,
        parcel_description: parcel.description || null,
        price_zar: chosen.totalprice_normal,
        status: "booked",
      }).select("waybill_number").single();

      if (error) throw error;

      // Initial event
      // (RLS allows only staff to insert events; we skip and rely on default 'booked' status)

      toast.success(`Shipment booked! Waybill ${data.waybill_number}`);
      navigate(`/track?n=${encodeURIComponent(data.waybill_number)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to book shipment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Package className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl font-bold">Book a Shipment</h1>
            <p className="text-muted-foreground">Step {step} of 4</p>
          </div>

          {/* Stepper */}
          <div className="mb-8 flex items-center justify-between">
            {["Sender", "Receiver", "Parcel", "Review"].map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3 | 4;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    done ? "border-success bg-success text-success-foreground" :
                    active ? "border-accent bg-accent text-accent-foreground" :
                    "border-muted bg-background text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : n}
                  </div>
                  <span className={`ml-2 hidden text-sm sm:inline ${active ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
                  {i < 3 && <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-success" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>

          <Card className="shadow-card">
            {step === 1 && (
              <>
                <CardHeader><CardTitle>Sender details</CardTitle><CardDescription>Where the parcel is being collected from</CardDescription></CardHeader>
                <CardContent><PartyForm value={sender} onChange={setSender} /></CardContent>
              </>
            )}
            {step === 2 && (
              <>
                <CardHeader><CardTitle>Receiver details</CardTitle><CardDescription>Where the parcel is being delivered to</CardDescription></CardHeader>
                <CardContent><PartyForm value={receiver} onChange={setReceiver} /></CardContent>
              </>
            )}
            {step === 3 && (
              <>
                <CardHeader><CardTitle>Parcel details</CardTitle><CardDescription>Weight and contents</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" step="0.1" min="0.1" max="100" value={parcel.weight_kg}
                      onChange={(e) => setParcel({ ...parcel, weight_kg: e.target.value })} placeholder="e.g. 2.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Contents description (optional)</Label>
                    <Textarea id="desc" value={parcel.description}
                      onChange={(e) => setParcel({ ...parcel, description: e.target.value })}
                      placeholder="e.g. Books, electronics" maxLength={200} />
                  </div>
                </CardContent>
              </>
            )}
            {step === 4 && (
              <>
                <CardHeader><CardTitle>Choose service & confirm</CardTitle><CardDescription>Live pricing from Fastway</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  {quoting && <div className="py-8"><LoadingSpinner size="md" text="Getting prices..." /></div>}
                  {quoteError && (
                    <Alert variant="destructive">
                      <AlertDescription>{(quoteError as Error).message}</AlertDescription>
                    </Alert>
                  )}
                  {quote && quote.services.length > 0 && (
                    <RadioGroup
                      value={chosen?.name ?? ""}
                      onValueChange={(v) => setChosen(quote.services.find((s) => s.name === v) ?? null)}
                      className="space-y-2"
                    >
                      {[...quote.services].sort((a, b) => a.totalprice_normal - b.totalprice_normal).map((svc) => (
                        <Label key={svc.name} htmlFor={`svc-${svc.name}`}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/40 [&:has(:checked)]:border-accent [&:has(:checked)]:bg-accent/5">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem id={`svc-${svc.name}`} value={svc.name} />
                            <div>
                              <p className="font-semibold">{svc.name}</p>
                              <p className="text-xs text-muted-foreground">{svc.type} {svc.weightlimit ? `• up to ${svc.weightlimit}kg` : ""}</p>
                            </div>
                          </div>
                          <p className="font-display text-lg font-bold">R {svc.totalprice_normal.toFixed(2)}</p>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}

                  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    <p className="mb-2 font-semibold">Summary</p>
                    <p>From: {sender.name} — {sender.suburb}, {sender.postal_code}</p>
                    <p>To: {receiver.name} — {receiver.suburb}, {receiver.postal_code}</p>
                    <p>Parcel: {parcel.weight_kg}kg{parcel.description ? ` (${parcel.description})` : ""}</p>
                  </div>
                </CardContent>
              </>
            )}

            <div className="flex items-center justify-between gap-3 border-t p-6">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
              {step < 4 ? (
                <Button type="button" variant="accent" onClick={goNext} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" variant="accent" onClick={handleConfirm} disabled={!chosen || submitting} className="gap-2">
                  {submitting ? "Booking..." : "Confirm & Book"} <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

interface Party { name: string; phone: string; street: string; suburb: string; postal_code: string; }
const PartyForm = ({ value, onChange }: { value: Party; onChange: (v: Party) => void }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2 sm:col-span-2">
      <Label>Full name</Label>
      <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} maxLength={100} />
    </div>
    <div className="space-y-2">
      <Label>Phone</Label>
      <Input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} maxLength={20} />
    </div>
    <div className="space-y-2">
      <Label>Postal code</Label>
      <Input value={value.postal_code} onChange={(e) => onChange({ ...value, postal_code: e.target.value })} maxLength={4} />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <Label>Street address</Label>
      <Input value={value.street} onChange={(e) => onChange({ ...value, street: e.target.value })} maxLength={200} />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <Label>Suburb</Label>
      <Input value={value.suburb} onChange={(e) => onChange({ ...value, suburb: e.target.value })} maxLength={100} />
    </div>
  </div>
);

export default BookShipment;
