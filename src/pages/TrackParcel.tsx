import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, MapPin, Calendar, CheckCircle, AlertCircle, Clock, HelpCircle, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTrackingCache, TrackingResult } from "@/hooks/useTrackingCache";

const TrackParcel = () => {
  const [searchParams] = useSearchParams();
  const initial = searchParams.get("n") ?? "";
  const [trackingNumber, setTrackingNumber] = useState(initial);
  const [searchNumber, setSearchNumber] = useState<string | null>(initial || null);

  const { data: result, isLoading: loading, error, isFetching, invalidateCache } = useTrackingCache(searchNumber);

  useEffect(() => {
    const n = searchParams.get("n");
    if (n && n !== searchNumber) {
      setTrackingNumber(n);
      setSearchNumber(n);
    }
  }, [searchParams, searchNumber]);


  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      return;
    }

    setSearchNumber(trackingNumber.trim());
  };

  const handleRefresh = () => {
    invalidateCache();
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus.includes("deliver")) return <CheckCircle className="h-5 w-5 text-success" />;
    if (lowerStatus.includes("transit") || lowerStatus.includes("scan")) return <Clock className="h-5 w-5 text-info" />;
    return <Package className="h-5 w-5 text-accent" />;
  };

  const errorMessage = error instanceof Error ? error.message : error ? "An unexpected error occurred" : null;

  return (
    <TooltipProvider>
      <Layout>
        <div className="min-h-[calc(100vh-200px)] py-12 lg:py-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Package className="h-8 w-8" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Track Your Parcel
              </h1>
              <p className="mt-4 text-muted-foreground">
                Enter your tracking number to see real-time status updates and location information
              </p>
            </div>

            {/* Search Form */}
            <Card className="mx-auto max-w-2xl shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  Enter Tracking Number
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Your tracking number starts with 'Z' followed by digits (e.g., Z60000983328). Find it on your receipt or shipping confirmation.</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>
                  Your tracking number can be found on your receipt or shipping confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrack} className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="e.g., Z60000983328"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                      className="flex-1 font-mono text-lg"
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" variant="accent" className="gap-2" disabled={loading || isFetching}>
                    {loading || isFetching ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Track
                      </>
                    )}
                  </Button>
                </form>
                {result && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Results cached for 2 minutes</span>
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

            {/* Loading State */}
            {(loading || isFetching) && !result && (
              <div className="mt-12">
                <LoadingSpinner size="lg" text="Fetching tracking information..." />
              </div>
            )}

            {/* Error State */}
            {errorMessage && !loading && (
              <Alert variant="destructive" className="mx-auto mt-8 max-w-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tracking Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="mx-auto mt-8 max-w-2xl animate-slide-up">
                {/* Status Card */}
                <Card className="mb-6 border-accent/30 bg-accent/5 shadow-card">
                  <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                        {getStatusIcon(result.HasDScan ? "delivered" : "transit")}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                        <p className="font-display text-lg font-semibold text-foreground">
                          {result.HasDScan ? "Delivered" : result.Scans?.[0]?.StatusDescription || "In Transit"}
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-muted-foreground">Tracking Number</p>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        {result.LabelNumber}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info Card */}
                <Card className="mb-6 shadow-card">
                  <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
                    {result.DeliveryETADate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <p className="text-sm text-muted-foreground">Delivery ETA</p>
                            <p className="font-display font-semibold text-foreground">
                              {result.DeliveryETADate}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Estimated delivery date based on current transit progress</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {result.LastScanDate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <p className="text-sm text-muted-foreground">Last Known Scan</p>
                            <p className="font-display font-semibold text-foreground">
                              {result.LastScanDate}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Most recent location scan of your parcel</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(result.PickupFranchise || result.DeliveryFranchise) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-center">
                            <p className="text-sm text-muted-foreground">Route</p>
                            <p className="font-display font-semibold text-foreground">
                              {result.PickupFranchise} → {result.DeliveryFranchise}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Origin and destination franchises handling your parcel</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">Tracking History</CardTitle>
                    <CardDescription>
                      {result.Scans?.length || 0} tracking events found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.Scans && result.Scans.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-4 top-2 h-[calc(100%-20px)] w-0.5 bg-border" />
                        <div className="space-y-6">
                          {result.Scans.map((scan, index) => (
                            <div key={index} className="relative flex gap-4 pl-10">
                              <div className={`absolute left-2 top-1 h-5 w-5 rounded-full border-2 ${
                                index === 0 
                                  ? "border-accent bg-accent" 
                                  : "border-muted-foreground/30 bg-card"
                              }`}>
                                {index === 0 && (
                                  <div className="absolute inset-0 animate-ping rounded-full bg-accent/50" />
                                )}
                              </div>
                              <div className="flex-1 rounded-lg bg-secondary/50 p-4">
                                <p className="font-medium text-foreground">
                                  {scan.StatusDescription || scan.Description}
                                </p>
                                {scan.StatusDescription && scan.Description && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {scan.Description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {scan.Date}
                                  </span>
                                  {(scan.Name || scan.Franchise) && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {scan.Name || scan.Franchise}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        No tracking events available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default TrackParcel;
