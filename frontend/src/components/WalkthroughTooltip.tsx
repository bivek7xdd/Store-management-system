import { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

export default function WalkthroughTooltip({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    size,
    isLastStep,
}: TooltipRenderProps) {
    const progress = ((index + 1) / size) * 100;

    return (
        <div
            {...tooltipProps}
            className="relative w-[380px] max-w-[90vw] rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        >
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-black/5">
                <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #0d9488, #3b82f6)",
                        boxShadow: "0 0 10px rgba(13, 148, 136, 0.4)",
                    }}
                />
            </div>

            {/* Close Button */}
            <button
                {...closeProps}
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-white/50 backdrop-blur-md transition-all z-10"
                aria-label="Close tour"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="px-6 pt-7 pb-5">
                {step.title && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
                        <h3 className="text-lg font-bold text-gray-900 pr-8 tracking-tight">
                            {step.title as string}
                        </h3>
                    </div>
                )}
                <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                    {step.content as string}
                </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-between">
                {/* Step Indicator */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Step {index + 1} of {size}
                    </span>
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(size, 10) }).map((_, i) => {
                            // If more than 10 steps, we could do more complex logic, but for now let's just show them neatly
                            const isActive = i === Math.floor((index / size) * 10);
                            return (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${isActive ? "w-4 bg-teal-500" : "w-1 bg-gray-200"
                                        }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                    {index === 0 ? (
                        <button
                            {...skipProps}
                            type="button"
                            title="" // Prevent native tooltip
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-white/40 rounded-xl transition-all"
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                            Skip
                        </button>
                    ) : (
                        <button
                            {...backProps}
                            type="button"
                            title="" // Prevent native tooltip
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-white/40 rounded-xl transition-all"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Back
                        </button>
                    )}

                    {continuous && (
                        <button
                            {...primaryProps}
                            type="button"
                            title="" // Prevent native tooltip
                            className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-bold shadow-[0_4px_12px_rgba(13,148,136,0.3)] text-white transition-all transform hover:scale-[1.05] active:scale-[0.95] hover:shadow-[0_6px_20px_rgba(13,148,136,0.4)]"
                            style={{
                                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                            }}
                        >
                            {isLastStep ? (
                                "Get Started"
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
