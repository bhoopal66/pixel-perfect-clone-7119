import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free exchange rate API - no API key required
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

interface ExchangeRatesResponse {
  base: string;
  date: string;
  time_last_updated: number;
  rates: Record<string, number>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseCurrency = 'AED' } = await req.json().catch(() => ({}));
    
    console.log(`Fetching exchange rates for base currency: ${baseCurrency}`);

    const response = await fetch(`${EXCHANGE_API_URL}/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Exchange API returned ${response.status}: ${await response.text()}`);
    }

    const data: ExchangeRatesResponse = await response.json();
    
    // Filter to only include currencies we support
    const supportedCurrencies = [
      'AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'BHD', 'OMR', 'QAR',
      'INR', 'PKR', 'PHP', 'EGP', 'JOD', 'CHF', 'JPY', 'CNY', 'AUD',
      'CAD', 'SGD', 'HKD'
    ];
    
    const filteredRates: Record<string, number> = {};
    for (const currency of supportedCurrencies) {
      if (data.rates[currency] !== undefined) {
        filteredRates[currency] = data.rates[currency];
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        base: data.base,
        date: data.date,
        rates: filteredRates,
        lastUpdated: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching exchange rates',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
