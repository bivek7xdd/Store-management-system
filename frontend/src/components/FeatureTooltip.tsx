import React, { useState, useEffect } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FeatureTooltipProps {
    featureKey: string;
    title: string;
    description: string;
    children: React.ReactElement;
    placement?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export function FeatureTooltip({
    featureKey,
    title,
    description,
    children,
    placement = "top",
    delay = 1000,
}: FeatureTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const storageKey = `storehub_feature_seen_${featureKey}`;

    useEffect(() => {
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [storageKey, delay]);

    const handleDismiss = () => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
    };

    if (!isVisible) return children;

    return (
        <TooltipProvider>
            <Tooltip open={isVisible}>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent 
                    side={placement} 
                    className="p-0 border-0 bg-transparent shadow-none"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="w-64 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl relative overflow-hidden"
                    >
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-teal-500/20 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-teal-400">
                                <span className="text-[10px] font-black uppercase tracking-wider">New Feature</span>
                                <button 
                                    onClick={handleDismiss}
                                    className="ml-auto text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            
                            <h4 className="text-sm font-bold mb-1">{title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                {description}
                            </p>
                            
                            <button
                                onClick={handleDismiss}
                                className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-[10px] font-bold transition-all active:scale-95"
                            >
                                Got it!
                            </button>
                        </div>
                    </motion.div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
