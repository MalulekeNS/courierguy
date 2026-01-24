import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Fastway Couriers South Africa. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Technical Assessment Demo Application
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
