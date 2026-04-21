import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrackingEvent {
  Description: string;
  Date: string;
  Time?: string;
  Franchise: string;
  Name?: string;
  Type: string;
  StatusDescription?: string;
  RealDateTime?: string;
}

interface TrackingResult {
  LabelNumber: string;
  Status?: string;
  Scans: TrackingEvent[];
  DeliveryETADate?: string;
  LastScanDate?: string;
  PickupFranchise?: string;
  DeliveryFranchise?: string;
  DistributedTo?: string;
  HasDScan?: boolean;
}

async function fetchInternalShipment(waybill: string): Promise<TrackingResult> {
  const { data: shipment, error: sErr } = await supabase
    .from("shipments")
    .select("waybill_number, status, sender_franchise_code, receiver_franchise_code, receiver_suburb, created_at")
    .eq("waybill_number", waybill)
    .maybeSingle();
  if (sErr) throw new Error("Unable to look up shipment.");
  if (!shipment) throw new Error("No shipment found for this waybill number.");

  const { data: events } = await supabase
    .from("shipment_events")
    .select("status, description, location, created_at")
    .eq("shipment_id", (await supabase.from("shipments").select("id").eq("waybill_number", waybill).maybeSingle()).data?.id ?? "")
    .order("created_at", { ascending: false });

  const scans: TrackingEvent[] = [
    {
      Description: shipment.status.replace(/_/g, " "),
      Date: new Date(shipment.created_at).toLocaleDateString(),
      Time: new Date(shipment.created_at).toLocaleTimeString(),
      Franchise: shipment.sender_franchise_code,
      Type: "Booked",
      StatusDescription: shipment.status,
    },
    ...(events ?? []).map((e) => ({
      Description: e.description,
      Date: new Date(e.created_at).toLocaleDateString(),
      Time: new Date(e.created_at).toLocaleTimeString(),
      Franchise: e.location ?? shipment.sender_franchise_code,
      Type: e.status,
      StatusDescription: e.status,
    })),
  ];

  return {
    LabelNumber: shipment.waybill_number,
    Status: shipment.status,
    Scans: scans,
    PickupFranchise: shipment.sender_franchise_code,
    DeliveryFranchise: shipment.receiver_franchise_code ?? undefined,
    HasDScan: shipment.status === "delivered",
  };
}

async function fetchTracking(trackingNumber: string): Promise<TrackingResult> {
  // Internal waybill format
  if (/^FW-/i.test(trackingNumber)) {
    return fetchInternalShipment(trackingNumber.toUpperCase());
  }

  const { data, error: invokeError } = await supabase.functions.invoke('fastway-track', {
    body: { trackingNumber },
  });

  if (invokeError) {
    throw new Error("Unable to connect to tracking service. Please try again later.");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.result) {
    throw new Error("No tracking information found for this number. Please check and try again.");
  }

  // Store search in database (fire and forget)
  try {
    await supabase.from('tracking_searches').insert({
      tracking_number: trackingNumber,
      result_status: data.result.HasDScan ? 'Delivered' : 'In Transit',
      has_result: true,
    });
    console.log('Tracking search logged');
  } catch (err) {
    console.error('Failed to log tracking search:', err);
  }

  return data.result;
}

export function useTrackingCache(trackingNumber: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tracking', trackingNumber],
    queryFn: () => fetchTracking(trackingNumber!),
    enabled: !!trackingNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes - tracking data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 1,
  });

  const invalidateCache = () => {
    if (trackingNumber) {
      queryClient.invalidateQueries({ queryKey: ['tracking', trackingNumber] });
    }
  };

  return {
    ...query,
    invalidateCache,
  };
}

export type { TrackingResult, TrackingEvent };
