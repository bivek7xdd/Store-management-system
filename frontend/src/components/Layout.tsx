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
} from "lucide-react";

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

// Teal color palette
const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
  primaryLight: "#14b8a6",
  accent: "#134e4a",
};

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
    <div className="min-h-screen" style={{ background: "#fafaf9" }}>
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
          className="flex grow flex-col overflow-y-auto border-r px-5 pb-4"
          style={{ background: "#ffffff", borderColor: `${colors.primary}15` }}
        >
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b" style={{ borderColor: `${colors.primary}15` }}>
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center"
              style={{ background: colors.primaryDark }}
            >
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: colors.primaryDark }}>StoreHub</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col mt-6">
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Menu
            </p>
            <ul role="list" className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-white shadow-lg"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                      style={isActive ? {
                        background: colors.primaryDark,
                        boxShadow: `0 4px 14px -3px ${colors.primary}50`
                      } : {}}
                    >
                      <Icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                      )} />
                      {item.label}
                      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* User Menu */}
            <div className="mt-auto pt-4 border-t" style={{ borderColor: `${colors.primary}15` }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-6 rounded-xl hover:bg-gray-50"
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: colors.primary }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                      <span className="text-xs text-gray-500">{user?.store_name}</span>
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
        className="lg:hidden fixed top-14 left-0 right-0 z-40 flex items-center justify-between border-b px-4 py-3"
        style={{ background: "#ffffff", borderColor: `${colors.primary}15` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: colors.primaryDark }}
          >
            <Store className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: colors.primaryDark }}>StoreHub</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: colors.primary }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-28" style={{ background: "#ffffff" }}>
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
                          ? "text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                      style={isActive ? { background: colors.primaryDark } : {}}
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
      )}

      {/* Main Content */}
      <main className="pt-14 lg:pl-72">
        <div className="lg:hidden h-16" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{ background: "#ffffff", borderColor: `${colors.primary}15` }}
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
                      ? "text-teal-600"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                  style={isActive ? { color: colors.primary } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
