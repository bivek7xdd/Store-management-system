import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";
import { walkthroughSteps, WalkthroughStep } from "@/data/walkthroughSteps";
import WalkthroughTooltip from "@/components/WalkthroughTooltip";

const WALKTHROUGH_STORAGE_KEY = "storehub_walkthrough_completed";

interface WalkthroughContextType {
    isRunning: boolean;
    hasCompletedTour: boolean;
    startTour: () => void;
    stopTour: () => void;
    resetTour: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (context === undefined) {
        throw new Error("useWalkthrough must be used within a WalkthroughProvider");
    }
    return context;
};

/**
 * Poll the DOM until a target element appears, then invoke a callback.
 * Gives up after maxAttempts to avoid infinite loops.
 */
function waitForElement(selector: string, callback: () => void, interval = 200, maxAttempts = 30) {
    let attempts = 0;
    const check = () => {
        attempts++;
        if (document.querySelector(selector)) {
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(check, interval);
        } else {
            // Element never appeared — resume anyway so the tour can skip it
            callback();
        }
    };
    // Small initial delay to let React start rendering
    setTimeout(check, 100);
}

interface WalkthroughProviderProps {
    children: ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isRunning, setIsRunning] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [hasCompletedTour, setHasCompletedTour] = useState(() => {
        return localStorage.getItem(WALKTHROUGH_STORAGE_KEY) === "true";
    });

    const isNavigatingRef = useRef(false);
    const pendingStepRef = useRef<number | null>(null);

    // Auto-start tour on first visit to dashboard
    React.useEffect(() => {
        if (location.pathname === "/" && !hasCompletedTour && !isRunning) {
            const timer = setTimeout(() => {
                setStepIndex(0);
                setIsRunning(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [location.pathname, hasCompletedTour]);

    // Resume tour after navigation — wait for the target element to appear
    React.useEffect(() => {
        if (isNavigatingRef.current && pendingStepRef.current !== null) {
            const idx = pendingStepRef.current;
            const step = walkthroughSteps[idx] as WalkthroughStep;
            const selector = typeof step.target === "string" ? step.target : "";

            isNavigatingRef.current = false;
            pendingStepRef.current = null;

            if (selector && selector !== "body") {
                waitForElement(selector, () => {
                    setIsRunning(true);
                });
            } else {
                // "body" target always exists
                setTimeout(() => setIsRunning(true), 150);
            }
        }
    }, [location.pathname]);

    const startTour = useCallback(() => {
        navigate("/");
        setStepIndex(0);
        setTimeout(() => setIsRunning(true), 300);
    }, [navigate]);

    const stopTour = useCallback(() => {
        setIsRunning(false);
        setStepIndex(0);
    }, []);

    const resetTour = useCallback(() => {
        localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
        setHasCompletedTour(false);
    }, []);

    const navigateToStep = useCallback((nextIndex: number) => {
        const nextStep = walkthroughSteps[nextIndex] as WalkthroughStep;
        const nextPage = nextStep.page || "/";

        if (nextPage !== location.pathname) {
            isNavigatingRef.current = true;
            pendingStepRef.current = nextIndex;
            setStepIndex(nextIndex);
            setIsRunning(false);
            navigate(nextPage);
        } else {
            setStepIndex(nextIndex);
        }
    }, [location.pathname, navigate]);

    const handleJoyrideCallback = useCallback((data: CallBackProps) => {
        const { status, action, type, index } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setIsRunning(false);
            setStepIndex(0);
            setHasCompletedTour(true);
            localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "true");
            navigate("/");
            return;
        }

        if (action === ACTIONS.CLOSE) {
            setIsRunning(false);
            setStepIndex(0);
            return;
        }

        if (type === EVENTS.STEP_AFTER) {
            const isLastStep = index === walkthroughSteps.length - 1;

            if (isLastStep && action === ACTIONS.NEXT) {
                // Explicitly handle finishing the tour on the last step
                setIsRunning(false);
                setStepIndex(0);
                setHasCompletedTour(true);
                localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "true");
                navigate("/");
                return;
            }

            const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            if (nextIndex >= 0 && nextIndex < walkthroughSteps.length) {
                navigateToStep(nextIndex);
            }
            return;
        }

        if (type === EVENTS.TARGET_NOT_FOUND) {
            const nextIndex = index + 1;
            if (nextIndex < walkthroughSteps.length) {
                navigateToStep(nextIndex);
            } else {
                setIsRunning(false);
                setStepIndex(0);
                setHasCompletedTour(true);
                localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "true");
            }
        }
    }, [location.pathname, navigate, navigateToStep]);

    const value: WalkthroughContextType = {
        isRunning,
        hasCompletedTour,
        startTour,
        stopTour,
        resetTour,
    };

    return (
        <WalkthroughContext.Provider value={value}>
            <Joyride
                steps={walkthroughSteps}
                run={isRunning}
                stepIndex={stepIndex}
                continuous
                showProgress
                showSkipButton
                scrollToFirstStep
                disableOverlayClose
                spotlightClicks={false}
                callback={handleJoyrideCallback}
                tooltipComponent={WalkthroughTooltip}
                locale={{
                    back: "Back",
                    close: "Close",
                    last: "Finish",
                    next: "Next",
                    skip: "Skip Tour",
                }}
                styles={{
                    options: {
                        zIndex: 10000,
                        arrowColor: "rgba(255, 255, 255, 0.7)",
                        overlayColor: "rgba(15, 23, 42, 0.65)", // Slate-900 with transparency
                    },
                    overlay: {
                        mixBlendMode: "unset" as React.CSSProperties["mixBlendMode"],
                        transition: "all 0.4s ease-in-out",
                    },
                    spotlight: {
                        borderRadius: 16,
                        backgroundColor: "transparent",
                        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px rgba(20, 184, 166, 0.4)",
                    },
                }}
                floaterProps={{
                    disableAnimation: false,
                    styles: {
                        floater: {
                            filter: "none",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        },
                    },
                }}
            />
            {children}
        </WalkthroughContext.Provider>
    );
};
