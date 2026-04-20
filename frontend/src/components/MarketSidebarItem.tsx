import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    TrendingUp,
    LineChart,
    MapPin,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSidebar } from "@/hooks/useSidebar";

export function MarketSidebarItem({ isActive, isOnline = true }: { isActive: boolean; isOnline?: boolean }) {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    const marketLinks = [
        { icon: LineChart, label: "Market Insights", path: "/market" },
        { icon: MapPin, label: "Find Suppliers", path: "/market/discovery" },
    ];

    const isOfflineDisabled = !isOnline;

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Link
                        to={isOfflineDisabled ? "#" : "/market"}
                        className={cn(
                            "flex items-center justify-center rounded-[2px] py-2.5 transition-all",
                            isActive && !isOfflineDisabled ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white",
                            isOfflineDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <TrendingUp className={cn("h-[16px] w-[16px]", isActive && !isOfflineDisabled ? "text-[#DA291C]" : "text-[#888888]")} />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                    Market
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Accordion type="single" collapsible={!isOfflineDisabled} className={cn("w-full")} data-tour="sidebar-market">
            <AccordionItem value="market" className="border-0">
                <AccordionTrigger
                    onClick={(e) => isOfflineDisabled && e.preventDefault()}
                    className={cn(
                        "group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-[13px] font-normal transition-all hover:no-underline",
                        isActive && !isOfflineDisabled ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white",
                        isOfflineDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp className={cn("h-[16px] w-[16px]", isActive && !isOfflineDisabled ? "text-[#DA291C]" : "text-[#888888] group-hover:text-white")} />
                        Market
                    </div>
                    {isOfflineDisabled && <span className="ml-[10px] text-[9px] uppercase font-bold text-[#DA291C]">Offline</span>}
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-11 pr-2">
                    <div className="flex flex-col gap-1 pt-1 pb-2">
                        {marketLinks.map((item) => {
                            const Icon = item.icon;
                            const isLinkActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 rounded-[2px] px-3 py-2 text-[12px] font-normal transition-colors",
                                        isLinkActive
                                            ? "text-white"
                                            : "text-[#888888] hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("h-3.5 w-3.5", isLinkActive ? "text-[#DA291C]" : "text-[#555555]")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
