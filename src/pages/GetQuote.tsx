import { useState, useMemo } from "react";
import { Calculator, Truck, DollarSign, Package, AlertCircle, CheckCircle, HelpCircle, ArrowUpDown, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuoteCache, QuoteParams, QuoteService } from "@/hooks/useQuoteCache";

const RF_CODE = "JNB";

type SortOption = 'price-asc' | 'price-desc' | 'weight-desc' | 'name-asc';

const GetQuote = () => {
  const [formData, setFormData] = useState({
    suburb: "",
    postalCode: "",
    weight: "",
  });
  const [searchParams, setSearchParams] = useState<QuoteParams | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: result, isLoading: loading, error, isFetching, invalidateCache } = useQuoteCache(searchParams);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const validateForm = () => {
    if (!formData.suburb.trim()) return "Please enter a destination suburb";
    if (!formData.postalCode.trim()) return "Please enter a postal code";
    if (!formData.weight.trim() || parseFloat(formData.weight) <= 0) {
      return "Please enter a valid weight";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSearchParams({
      suburb: formData.suburb.trim(),
      postalCode: formData.postalCode.trim(),
      weight: formData.weight.trim(),
      rfCode: RF_CODE,
    });
  };

  const handleRefresh = () => {
    invalidateCache();
  };

  // Sort services based on selected option
  const sortedServices = useMemo(() => {
    if (!result?.services) return [];
    
    return [...result.services].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.totalprice_normal - b.totalprice_normal;
        case 'price-desc':
          return b.totalprice_normal - a.totalprice_normal;
        case 'weight-desc':
          return (b.weightlimit || 0) - (a.weightlimit || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [result?.services, sortBy]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price);
  };

  const errorMessage = error instanceof Error ? error.message : error ? "An unexpected error occurred" : formError;

  return (
    <TooltipProvider>
      <Layout>
        <div className="min-h-[calc(100vh-200px)] py-12 lg:py-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Calculator className="h-8 w-8" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Get a Shipping Quote
              </h1>
              <p className="mt-4 text-muted-foreground">
                Calculate your shipping costs instantly by entering your destination and parcel details
              </p>
            </div>

            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Form */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">Parcel Details</CardTitle>
                    <CardDescription>
                      Fill in the details below to get a shipping quote
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="suburb">Destination Suburb</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Enter the suburb name where the parcel will be delivered (e.g., Sandton, Cape Town CBD)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="suburb"
                          name="suburb"
                          placeholder="e.g., Sandton"
                          value={formData.suburb}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">4-digit South African postal code for the destination (e.g., 2196 for Sandton)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          placeholder="e.g., 2196"
                          value={formData.postalCode}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="weight">Parcel Weight (kg)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Enter the weight of your parcel in kilograms. Minimum 0.1kg, maximum depends on service type.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="weight"
                          name="weight"
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="e.g., 2.5"
                          value={formData.weight}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                      <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading || isFetching}>
                        {loading || isFetching ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            Get Quote
                          </>
                        )}
                      </Button>
                    </form>
                    {result && (
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Results cached for 5 minutes</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto gap-1 p-1 text-xs"
                          onClick={handleRefresh}
                          disabled={isFetching}
                        >
                          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Results / Info Panel */}
                <div className="space-y-6">
                  {/* Loading */}
                  {(loading || isFetching) && !result && (
                    <Card className="shadow-card">
                      <CardContent className="flex min-h-[300px] items-center justify-center">
                        <LoadingSpinner size="lg" text="Calculating shipping options..." />
                      </CardContent>
                    </Card>
                  )}

                  {/* Error */}
                  {errorMessage && !loading && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Quote Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* Results */}
                  {result && !loading && (
                    <div className="animate-slide-up space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          Available Shipping Options
                        </h3>
                        {/* Sorting Controls */}
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="price-asc">Price: Low to High</SelectItem>
                              <SelectItem value="price-desc">Price: High to Low</SelectItem>
                              <SelectItem value="weight-desc">Weight Capacity</SelectItem>
                              <SelectItem value="name-asc">Name A-Z</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Delivery Summary */}
                      <Card className="border-info/30 bg-info/5 shadow-sm">
                        <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
                          {result.delivery_timeframe_days && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help text-center">
                                  <p className="text-xs text-muted-foreground">Delivery Time</p>
                                  <p className="font-semibold text-foreground">{result.delivery_timeframe_days} days</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Estimated business days for delivery</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {result.from && result.delfranchise && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help text-center">
                                  <p className="text-xs text-muted-foreground">Route</p>
                                  <p className="font-semibold text-foreground">{result.from} → {result.delfranchise}</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Shipping route from origin to destination franchise</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help text-center">
                                <p className="text-xs text-muted-foreground">Delivery Area</p>
                                <p className="font-semibold text-foreground">
                                  {result.isRural ? "Rural" : "Metro"} 
                                  {result.isSaturdayDeliveryAvailable && " • Sat Delivery"}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{result.isRural ? "Rural areas may have longer delivery times" : "Metro areas have faster delivery options"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </CardContent>
                      </Card>

                      {sortedServices.map((service, index) => (
                        <Card key={index} className="overflow-hidden shadow-card transition-all hover:shadow-card-hover">
                          <CardContent className="p-0">
                            <div className="flex items-stretch">
                              <div 
                                className="flex w-2 flex-shrink-0"
                                style={{ backgroundColor: "hsl(var(--accent))" }}
                              />
                              <div className="flex flex-1 flex-col justify-between p-4 sm:flex-row sm:items-center">
                                <div className="mb-3 sm:mb-0">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-accent" />
                                    <p className="font-display font-semibold text-foreground">
                                      {service.name}
                                    </p>
                                    {index === 0 && sortBy === 'price-asc' && (
                                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                                        Cheapest
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    {service.type && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help rounded bg-secondary px-2 py-0.5 text-xs">
                                            {service.type}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Service type: {service.type}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {service.weightlimit && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help rounded bg-secondary px-2 py-0.5 text-xs">
                                            Up to {service.weightlimit}kg
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Maximum weight limit for this service</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {service.labelcolour_pretty && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help rounded bg-secondary px-2 py-0.5 text-xs">
                                            {service.labelcolour_pretty}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Label type for this shipping service</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-display text-2xl font-bold text-accent">
                                    {formatPrice(service.totalprice_normal)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Excl. VAT: {formatPrice(service.totalprice_normal_exgst)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="flex items-start gap-2 rounded-lg bg-success/10 p-4">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                        <div>
                          <p className="font-medium text-success">Quote Generated Successfully</p>
                          <p className="text-sm text-muted-foreground">
                            Prices are estimates and may vary based on actual parcel dimensions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Default Info */}
                  {!result && !loading && !errorMessage && (
                    <Card className="border-dashed shadow-sm">
                      <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          Ready to Calculate
                        </h3>
                        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                          Fill in the parcel details on the left to see available shipping options and prices
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Info Box */}
                  <div className="rounded-lg border border-info/30 bg-info/10 p-4">
                    <h4 className="flex items-center gap-2 font-display font-semibold text-info">
                      <Package className="h-5 w-5" />
                      Origin Location
                    </h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      All quotes are calculated from <strong>Johannesburg (JNB)</strong> as the origin franchise.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default GetQuote;
