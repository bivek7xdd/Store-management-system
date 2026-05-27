import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Wallet, TrendingUp, PieChart, CreditCard, ShoppingCart } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FinanceSidebarItem({ isActive }: { isActive: boolean }) {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    const financeLinks = [
        { icon: Wallet, label: "Expenses", path: "/finance/expenses" },
        { icon: CreditCard, label: "Supplier Payables", path: "/finance/payables" },
        { icon: ShoppingCart, label: "Purchase Orders", path: "/inventory/purchase-orders" },
        { icon: TrendingUp, label: "Cash Flow", path: "/finance/cashflow" },
        { icon: PieChart, label: "Balance Sheet", path: "/finance/balance-sheet" },
    ];

    if (isCollapsed) {
        return (
            <DropdownMenu>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "flex items-center justify-center rounded-[2px] py-2.5 transition-all w-full",
                                    isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                                )}
                            >
                                <Wallet className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888]")} />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#111111] border-[#303030] text-white">
                        Finance
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="start" sideOffset={10} className="bg-[#111111] border-[#1A1A1A] p-1 min-w-[160px]">
                    {financeLinks.map((item) => {
                        const isLinkActive = location.pathname === item.path;
                        return (
                            <DropdownMenuItem key={item.path} asChild>
                                <Link
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-[2px] text-[12px] cursor-pointer transition-colors",
                                        isLinkActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white focus:bg-[#111111] focus:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-3.5 w-3.5", isLinkActive ? "text-[#DA291C]" : "text-[#555555]")} />
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full" data-tour="sidebar-finance">
            <AccordionItem value="finance" className="border-0">
                <AccordionTrigger
                    className={cn(
                        "group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-[13px] font-normal transition-all hover:no-underline",
                        isActive ? "bg-[#1A1A1A] text-white" : "text-[#AAAAAA] hover:bg-[#111111] hover:text-white"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Wallet className={cn("h-[16px] w-[16px]", isActive ? "text-[#DA291C]" : "text-[#888888] group-hover:text-white")} />
                        Finance
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-11 pr-2">
                    <div className="flex flex-col gap-1 pt-1 pb-2">
                        {financeLinks.map((item) => {
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
