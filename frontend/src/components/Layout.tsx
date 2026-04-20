import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  LogOut,
  Settings as SettingsIcon,
  Store,
  ChevronRight,
  Wifi,
  WifiOff,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { InventorySidebarItem } from "./InventorySidebarItem";
import { SalesSidebarItem } from "./SalesSidebarItem";
import { MarketSidebarItem } from "./MarketSidebarItem";
import NotificationBell from "./NotificationBell";
import categoryPreferencesService from "@/services/categoryPreferences";
import { BUSINESS_CATEGORIES } from "@/data/businessCategories";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarToggle } from "./SidebarToggle";
import { useSidebar } from "@/hooks/useSidebar";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: ShoppingCart, label: "Sales", path: "/sales" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Wallet, label: "Debtors", path: "/debtors" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: TrendingUp, label: "Market", path: "/market" },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { isCollapsed } = useSidebar();
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

  // Globally auto-create categories from signup prefs
  useEffect(() => {
    const prefs = categoryPreferencesService.retrieve();
    if (prefs && prefs.product_subcategories && prefs.product_subcategories.length > 0) {
      const allSubs = BUSINESS_CATEGORIES.flatMap(cat =>
        cat.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          parentName: cat.name
        }))
      );
      const selected = allSubs.filter(sub => prefs.product_subcategories.includes(sub.id));
      if (selected.length > 0) {
        const autoCreate = async () => {
          try {
            await Promise.all(selected.map(sub => inventoryService.createCategory({
              name: sub.name,
              description: `${sub.parentName} Category`
            })));
            categoryPreferencesService.clear();
            queryClient.invalidateQueries({ queryKey: ["categories"] });
          } catch (err) {
            console.error("Failed to auto-create categories", err);
          }
        };
        autoCreate();
      } else {
        categoryPreferencesService.clear();
      }
    }
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 h-7 flex items-center justify-center gap-2 bg-[#DA291C] text-white text-[11px] uppercase tracking-[1px] font-medium">
          <WifiOff className="w-3 h-3" />
          Offline — changes will sync when reconnected
        </div>
      )}

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-[#1A1A1A] bg-[#000000] z-40",
          !isOnline && "top-7"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-[64px] border-b border-[#1A1A1A] shrink-0 transition-all overflow-hidden",
          isCollapsed ? "px-4 justify-center" : "px-6 gap-3"
        )}>
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-[#DA291C]" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col min-w-0"
            >
              <h1 className="text-[14px] font-medium tracking-[0.5px] text-white truncate">StoreHub</h1>
              <p className="text-[11px] text-[#555555] tracking-[0.5px] truncate">Management System</p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col pt-6 overflow-y-auto no-scrollbar" data-tour="sidebar-nav">
          <p className={cn(
            "px-6 mb-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[#555555] transition-opacity",
            isCollapsed && "opacity-0 invisible h-0 mb-0"
          )}>
            Navigation
          </p>
          <div className={cn("flex flex-1 flex-col gap-0.5", isCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

              if (item.label === "Inventory") return <InventorySidebarItem key={item.path} isActive={isActive} />;
              if (item.label === "Sales") return <SalesSidebarItem key={item.path} isActive={isActive} />;
              if (item.label === "Market") return <MarketSidebarItem key={item.path} isActive={isActive} isOnline={isOnline} />;

              const isOfflineDisabled = !isOnline && item.label === "Reports";

              const linkContent = (
                <Link
                  key={item.path}
                  to={isOfflineDisabled ? "#" : item.path}
                  data-tour={`sidebar-${item.label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-3 rounded-[2px] py-2.5 text-[13px] font-normal transition-all overflow-hidden",
                    isCollapsed ? "px-2 justify-center" : "px-3",
                    isActive
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white",
                    isOfflineDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                  aria-disabled={isOfflineDisabled}
                >
                  <Icon className={cn(
                    "h-[16px] w-[16px] shrink-0",
                    isActive ? "text-[#DA291C]" : "text-[#888888]"
                  )} />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {!isCollapsed && isActive && !isOfflineDisabled && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#555555]" />
                  )}
                  {!isCollapsed && isOfflineDisabled && (
                    <span className="ml-auto text-[9px] uppercase font-bold text-[#DA291C]">Offline</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={300}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>

          {/* User + Notifications */}
          <div className={cn(
            "pt-3 pb-4 border-t border-[#1A1A1A] mt-auto flex flex-col gap-2",
            isCollapsed ? "items-center px-2" : "px-3"
          )} data-tour="user-profile">
            <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
              {isCollapsed ? (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div><NotificationBell /></div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                    Notifications
                  </TooltipContent>
                </Tooltip>
              ) : (
                <NotificationBell />
              )}
              
              <div className={cn("hidden lg:block", !isCollapsed && "ml-auto")}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarToggle />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                    {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <DropdownMenu>
              <Tooltip delayDuration={300} disabled={!isCollapsed}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "flex items-center rounded-[2px] hover:bg-[#111111] transition-colors text-left overflow-hidden",
                      isCollapsed ? "px-0 justify-center w-8 h-8" : "flex-1 px-3 py-2 gap-3"
                    )}>
                      <div className="h-7 w-7 rounded-[2px] flex items-center justify-center text-white text-[12px] font-semibold bg-[#DA291C] shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-medium text-white truncate">{user?.name}</span>
                          <span className="text-[11px] text-[#888888] truncate">{user?.store_name}</span>
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                   Profile: {user?.name}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "top"} className="w-52 bg-[#111111] border-[#303030] text-white">
                <DropdownMenuLabel className="text-[#8F8F8F] text-[11px] uppercase tracking-[1px]">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#303030]" />
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-white cursor-pointer"
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#DA291C] hover:text-white hover:bg-[#DA291C]/20 focus:bg-[#DA291C]/20 focus:text-[#DA291C] cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </motion.aside>

      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden fixed left-0 right-0 z-40 flex items-center justify-between border-b border-[#1A1A1A] bg-[#000000] px-4 h-[56px]",
        !isOnline ? "top-7" : "top-0"
      )}>
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-[#DA291C]" />
          <h1 className="text-[14px] font-medium tracking-[0.5px] text-white">StoreHub</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 rounded-[2px] flex items-center justify-center text-white text-[11px] font-semibold bg-[#DA291C]">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#111111] border-[#303030] text-white">
              <DropdownMenuLabel className="text-[#8F8F8F] text-[11px] uppercase tracking-[1px]">{user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#303030]" />
              <DropdownMenuItem onClick={() => { navigate("/settings"); setMobileMenuOpen(false); }}
                className="text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}
                className="text-[#DA291C] focus:text-[#DA291C] hover:bg-[#DA291C]/20 focus:bg-[#DA291C]/20 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-[2px] text-[#666666] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className={cn(
          "lg:hidden fixed inset-0 z-30 bg-[#000000]",
          !isOnline ? "pt-[calc(56px+28px)]" : "pt-[56px]"
        )}>
          <nav className="px-3 pt-4">
            <p className="px-3 mb-3 text-[10px] font-medium uppercase tracking-[1.5px] text-[#555555]">Navigation</p>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isOfflineDisabled = !isOnline && (item.label === "Reports" || item.label === "Market");
                return (
                  <li key={item.path}>
                    <Link
                      to={isOfflineDisabled ? "#" : item.path}
                      onClick={(e) => {
                        if (isOfflineDisabled) e.preventDefault();
                        else setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-[2px] p-3 text-[14px] font-normal transition-all",
                        isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white",
                        isOfflineDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#DA291C]" : "text-[#888888]")} />
                      {item.label}
                      {isOfflineDisabled && <span className="ml-auto text-[9px] uppercase font-bold text-[#DA291C]">Offline</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (isCollapsed ? 64 : 240) : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "min-h-screen",
          !isOnline ? "pt-[calc(56px+28px)] lg:pt-7" : "pt-[56px] lg:pt-0"
        )}
      >
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-h-screen">{children}</div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#1A1A1A] bg-[#000000]">
        <ul className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-normal transition-colors",
                    isActive ? "text-white" : "text-[#AAAAAA] hover:text-white"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-[#DA291C]" : "")} />
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
