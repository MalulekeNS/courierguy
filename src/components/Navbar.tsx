import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Calculator, Menu, X, Home, LayoutDashboard, LogOut, LogIn, Truck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuth();

  const publicItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/track", label: "Track Parcel", icon: Package },
    { path: "/quote", label: "Get Quote", icon: Calculator },
  ];

  const authedItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const roleItems: { path: string; label: string; icon: typeof Home }[] = [];
  if (roles.includes("driver")) roleItems.push({ path: "/driver", label: "My Jobs", icon: Truck });
  if (roles.includes("admin") || roles.includes("franchisee")) roleItems.push({ path: "/operations", label: "Operations", icon: Building2 });

  const navItems = user ? [...publicItems, ...authedItems, ...roleItems] : publicItems;

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Package className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary-foreground">Fastway</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                    isActive(item.path) && "bg-primary-foreground/15 text-primary-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="gap-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="accent" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Log In
                </Button>
              </Link>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {isOpen && (
          <div className="animate-fade-in border-t border-primary-foreground/10 pb-4 md:hidden">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                    isActive(item.path) && "bg-primary-foreground/15 text-primary-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <Button
                variant="ghost"
                onClick={() => { setIsOpen(false); handleSignOut(); }}
                className="w-full justify-start gap-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="accent" className="w-full justify-start gap-3">
                  <LogIn className="h-5 w-5" />
                  Log In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
