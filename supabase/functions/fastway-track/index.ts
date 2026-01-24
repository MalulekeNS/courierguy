const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackingNumber } = await req.json();

    if (!trackingNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tracking number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FASTWAY_API_KEY');
    if (!apiKey) {
      console.error('FASTWAY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tracking parcel:', trackingNumber);

    const response = await fetch(
      `https://sa.api.fastway.org/latest/tracktrace/detail/${encodeURIComponent(trackingNumber)}?api_key=${apiKey}`
    );

    if (!response.ok) {
      console.error('Fastway API error:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to connect to tracking service' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Tracking response received');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error tracking parcel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to track parcel';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
