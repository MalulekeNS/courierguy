import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuoteService {
  name: string;
  totalprice_normal: number;
  totalprice_normal_exgst: number;
  etd_from?: number;
  etd_to?: number;
  labelcolour?: string;
  labelcolour_pretty?: string;
  type?: string;
  baseweight?: number;
  weightlimit?: number;
}

interface QuoteResult {
  services: QuoteService[];
  delivery_timeframe_days?: string;
  from?: string;
  delfranchise?: string;
  isRural?: boolean;
  isSaturdayDeliveryAvailable?: boolean;
}

interface QuoteParams {
  suburb: string;
  postalCode: string;
  weight: string;
  rfCode: string;
}

async function fetchQuote(params: QuoteParams): Promise<QuoteResult> {
  const { data, error: invokeError } = await supabase.functions.invoke('fastway-quote', {
    body: params,
  });

  if (invokeError) {
    throw new Error("Unable to connect to quote service. Please try again later.");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.result?.services || data.result.services.length === 0) {
    throw new Error("No shipping options available for this destination. Please check your details and try again.");
  }

  // Store quote request in database (fire and forget)
  const cheapestPrice = Math.min(...data.result.services.map((s: QuoteService) => s.totalprice_normal));
  
  try {
    await supabase.from('quote_requests').insert({
      suburb: params.suburb,
      postal_code: params.postalCode,
      weight: parseFloat(params.weight),
      rf_code: params.rfCode,
      cheapest_price: cheapestPrice,
      services_count: data.result.services.length,
    });
    console.log('Quote request logged');
  } catch (err) {
    console.error('Failed to log quote request:', err);
  }

  return data.result;
}

export function useQuoteCache(params: QuoteParams | null) {
  const queryClient = useQueryClient();

  const cacheKey = params 
    ? ['quote', params.suburb, params.postalCode, params.weight, params.rfCode]
    : ['quote'];

  const query = useQuery({
    queryKey: cacheKey,
    queryFn: () => fetchQuote(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes - quote data is more stable
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 1,
  });

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: cacheKey });
  };

  return {
    ...query,
    invalidateCache,
  };
}

export type { QuoteResult, QuoteService, QuoteParams };
