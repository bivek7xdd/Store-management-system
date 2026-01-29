import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  TrendingUp,
  Menu,
  X,
  User,
  LogOut,
  Store,
  ChevronRight,
  Plus,
  Box,
  Truck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { CreateCategoryDialog, CreateSupplierDialog } from "./CreateInventoryDialogs";
import { InventorySidebarItem } from "./InventorySidebarItem";
import { SalesSidebarItem } from "./SalesSidebarItem";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: ShoppingCart, label: "Sales", path: "/sales" },
  { icon: Users, label: "Debtors", path: "/debtors" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: TrendingUp, label: "Market", path: "/market" },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Status Banner */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all duration-300",
          isOnline
            ? "bg-emerald-500 text-white"
            : "bg-red-500 text-white"
        )}
      >
        {isOnline ? "🟢 Online" : "🔴 Offline – changes will sync when reconnected"}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:pt-14">
        <div
          className="flex grow flex-col overflow-y-auto border-r bg-background border-border px-5 pb-4"
        >
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-border">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary text-primary-foreground"
            >
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">StoreHub</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col mt-6">
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <div className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);

                if (item.label === "Inventory") {
                  return (
                    <InventorySidebarItem key={item.path} isActive={isActive} />
                  );
                }

                if (item.label === "Sales") {
                  return (
                    <SalesSidebarItem key={item.path} isActive={isActive} />
                  );
                }

                const isOfflineDisabled = !isOnline && item.label === "Reports";

                return (
                  <Link
                    key={item.path}
                    to={isOfflineDisabled ? "#" : item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isOfflineDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    aria-disabled={isOfflineDisabled}
                    style={isActive ? {
                      boxShadow: `0 4px 14px -3px rgba(0, 0, 0, 0.2)`
                    } : {}}
                  >
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.label}
                    {isOfflineDisabled && <span className="ml-auto text-[10px] uppercase font-bold text-red-500">Offline</span>}
                    {isActive && !isOfflineDisabled && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="mt-auto pt-4 border-t border-border flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-6 rounded-xl hover:bg-accent hover:text-accent-foreground"
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold bg-primary"
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.store_name}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-14 left-0 right-0 z-40 flex items-center justify-between border-b bg-background border-border px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground"
          >
            <Store className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-foreground">StoreHub</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-primary"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div >

      {/* Mobile Menu */}
      {
        mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-28 bg-background">
            <nav className="px-4 py-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl p-4 text-base font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        style={isActive ? {} : {}}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        )
      }

      {/* Main Content */}
      <main className="pt-14 lg:pl-72">
        <div className="lg:hidden h-16" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background border-border"
      >
        <ul className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors rounded-lg",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div >
  );
}
