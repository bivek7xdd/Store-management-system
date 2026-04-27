import { forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";

interface SidebarToggleProps {
  className?: string;
}

export const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ className }, ref) => {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        onClick={toggleSidebar}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#1A1A1A] bg-[#000000] text-[#AAAAAA] hover:bg-[#111111] hover:text-white transition-all shadow-sm",
          className
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    );
  }
);

SidebarToggle.displayName = "SidebarToggle";
