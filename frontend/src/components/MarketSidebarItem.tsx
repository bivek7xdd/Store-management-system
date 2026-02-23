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

export function MarketSidebarItem({ isActive }: { isActive: boolean }) {
    const location = useLocation();

    const marketLinks = [
        { icon: LineChart, label: "Market Insights", path: "/market" },
        { icon: MapPin, label: "Find Suppliers", path: "/market/discovery" },
    ];

    return (
        <Accordion type="single" collapsible className="w-full" data-tour="sidebar-market">
            <AccordionItem value="market" className="border-0">
                <AccordionTrigger
                    className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:no-underline",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        Market
                    </div>
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
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isLinkActive
                                            ? "bg-primary/20 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isLinkActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
