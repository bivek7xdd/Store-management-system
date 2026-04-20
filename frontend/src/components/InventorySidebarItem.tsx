import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    Package,
    Box,
    FolderOpen,
    Truck,
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

export function InventorySidebarItem({ isActive }: { isActive: boolean }) {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    const inventoryLinks = [
        { icon: Box, label: "All Products", path: "/inventory" },
        { icon: FolderOpen, label: "Categories", path: "/inventory/categories" },
        { icon: Truck, label: "Suppliers", path: "/inventory/suppliers" },
    ];

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Link
                        to="/inventory"
                        className={cn(
                            "flex items-center justify-center rounded-[2px] py-2.5 transition-all",
                            isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                        )}
                    >
                        <Package className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888]")} />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                    Inventory
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full" data-tour="sidebar-inventory">
            <AccordionItem value="inventory" className="border-0">
                <AccordionTrigger
                    className={cn(
                        "group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-[13px] font-normal transition-all hover:no-underline",
                        isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Package className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888] group-hover:text-white")} />
                        Inventory
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-11 pr-2">
                    <div className="flex flex-col gap-1 pt-1 pb-2">
                        {inventoryLinks.map((item) => {
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
