-- Create table for storing tracking searches
CREATE TABLE public.tracking_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  search_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  result_status TEXT,
  has_result BOOLEAN DEFAULT false
);

-- Create table for storing quote requests
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suburb TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  rf_code TEXT NOT NULL DEFAULT 'JNB',
  request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cheapest_price DECIMAL(10,2),
  services_count INTEGER DEFAULT 0
);

-- Enable RLS but allow public access (no auth required for this demo)
ALTER TABLE public.tracking_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insert and select (demo application, no auth)
CREATE POLICY "Allow public insert on tracking_searches"
ON public.tracking_searches
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on tracking_searches"
ON public.tracking_searches
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on quote_requests"
ON public.quote_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on quote_requests"
ON public.quote_requests
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_tracking_searches_timestamp ON public.tracking_searches(search_timestamp DESC);
CREATE INDEX idx_quote_requests_timestamp ON public.quote_requests(request_timestamp DESC);