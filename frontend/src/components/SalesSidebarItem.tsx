import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    ShoppingCart,
    ShoppingBag,
    History,
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

export function SalesSidebarItem({ isActive }: { isActive: boolean }) {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    const salesLinks = [
        { icon: ShoppingBag, label: "New Sale (POS)", path: "/sales" },
        { icon: History, label: "Sales History", path: "/sales/history" },
    ];

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Link
                        to="/sales"
                        className={cn(
                            "flex items-center justify-center rounded-[2px] py-2.5 transition-all text-left",
                            isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                        )}
                    >
                        <ShoppingCart className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888]")} />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                    Sales
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full" data-tour="sidebar-sales">
            <AccordionItem value="sales" className="border-0">
                <AccordionTrigger
                    className={cn(
                        "group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-[13px] font-normal transition-all hover:no-underline",
                        isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <ShoppingCart className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888] group-hover:text-white")} />
                        Sales
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-11 pr-2">
                    <div className="flex flex-col gap-1 pt-1 pb-2">
                        {salesLinks.map((item) => {
                            const Icon = item.icon;
                            // Check if link is strictly active or if it's the parent path (for nested routes if any)
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
