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

async function fetchTracking(trackingNumber: string): Promise<TrackingResult> {
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
