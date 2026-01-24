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
    const { suburb, postalCode, weight, rfCode = 'JNB' } = await req.json();

    if (!suburb || !postalCode || !weight) {
      return new Response(
        JSON.stringify({ success: false, error: 'Suburb, postal code, and weight are required' }),
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

    console.log('Getting quote for:', { suburb, postalCode, weight, rfCode });

    const params = new URLSearchParams({
      api_key: apiKey,
      RFCode: rfCode,
      Suburb: suburb,
      DestPostcode: postalCode,
      WeightInKg: weight.toString(),
    });

    const response = await fetch(
      `https://sa.api.fastway.org/latest/psc/lookup?${params.toString()}`
    );

    if (!response.ok) {
      console.error('Fastway API error:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to connect to quote service' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Quote response received');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting quote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
