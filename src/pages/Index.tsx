import { Package, Calculator, Truck, Shield, Clock, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const features = [
    {
      title: "Track Your Parcel",
      description: "Enter your tracking number to see real-time status updates and location information for your shipment.",
      icon: Package,
      link: "/track",
      buttonText: "Track Now",
    },
    {
      title: "Get a Quote",
      description: "Calculate shipping costs instantly by entering your destination, postal code, and parcel weight.",
      icon: Calculator,
      link: "/quote",
      buttonText: "Get Quote",
    },
  ];

  const benefits = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Reliable next-day and same-day delivery options",
    },
    {
      icon: Shield,
      title: "Secure Handling",
      description: "Your parcels are handled with care and fully insured",
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Track your shipment every step of the way",
    },
    {
      icon: MapPin,
      title: "Nationwide Coverage",
      description: "Delivering to every corner of South Africa",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Fast, Reliable{" "}
              <span className="text-accent">Courier Services</span>
            </h1>
            <p className="mt-6 animate-slide-up text-lg text-primary-foreground/80 md:text-xl">
              Track your parcels in real-time and get instant shipping quotes.
              Your trusted partner for courier services across South Africa.
            </p>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              What would you like to do?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choose from our quick actions below
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-secondary/50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Why Choose Fastway?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Trusted by thousands of customers across South Africa
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-info/30 bg-info/10 p-6">
            <h3 className="font-display text-lg font-semibold text-info">
              Test Tracking Numbers
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use these tracking numbers for testing the track and trace feature:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <code className="rounded-lg bg-card px-3 py-2 font-mono text-sm text-foreground shadow-sm">
                Z60000983328
              </code>
              <code className="rounded-lg bg-card px-3 py-2 font-mono text-sm text-foreground shadow-sm">
                Z30002408261
              </code>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
