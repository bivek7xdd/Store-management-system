import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Shield, RotateCcw } from "lucide-react";
import gsap from "gsap";

const OTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const bgShapesRef = useRef<HTMLDivElement>(null);

    // Get email from router state or default
    const email = location.state?.email || "your email";

    useEffect(() => {
        // Animation sequence
        const tl = gsap.timeline();

        // Background shapes animation
        if (bgShapesRef.current) {
            const shapes = bgShapesRef.current.children;
            gsap.to(shapes, {
                y: "random(-100, 100)",
                x: "random(-100, 100)",
                rotation: "random(-45, 45)",
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    amount: 2,
                    from: "random"
                }
            });

            // Initial fade in for shapes
            gsap.fromTo(shapes,
                { opacity: 0, scale: 0 },
                { opacity: 0.8, scale: 1, duration: 1.5, stagger: 0.2, ease: "back.out(1.7)" }
            );
        }

        tl.fromTo(
            containerRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.5 }
        )
            .fromTo(
                formRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
                "-=0.3"
            );

        // Focus first input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        // Allow only numbers
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pastedData.every(char => /^\d$/.test(char))) {
            const newOtp = [...otp];
            pastedData.forEach((char, index) => {
                if (index < 6) newOtp[index] = char;
            });
            setOtp(newOtp);

            // Focus the input after the last pasted character
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length !== 6) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log("Verifying OTP:", otpValue);

        setIsSubmitting(false);
        navigate("/login", { state: { message: "Account verified successfully! Please log in." } });
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #fffcf5 0%, #fef9f0 50%, #fdf6e8 100%)" }}
        >
            {/* Background Floating Shapes */}
            <div ref={bgShapesRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
                <div className="absolute top-[60%] right-[10%] w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute bottom-[10%] left-[20%] w-48 h-48 rounded-full bg-orange-400/20 blur-3xl" />

                {/* Decorative Elements */}
                <div className="absolute top-[15%] left-[15%] text-teal-600/40 transform rotate-12">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <div className="absolute bottom-[20%] right-[15%] text-emerald-600/40 transform -rotate-12">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <div className="absolute top-[40%] right-[25%] text-yellow-500/40">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="4" /></svg>
                </div>
            </div>

            <div
                ref={formRef}
                className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-teal-100 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your Account</h1>
                    <p className="text-gray-500">
                        We have sent a 6-digit code to<br />
                        <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700 text-center block">
                            Enter Confirmation Code
                        </Label>
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 transition-all duration-200 bg-white/50 focus:bg-white"
                                />
                            ))}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || otp.some(d => !d)}
                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all hover:translate-y-[-1px] active:translate-y-0"
                        style={{
                            background: "linear-gradient(135deg, #115e59, #0d9488)",
                            opacity: (isSubmitting || otp.some(d => !d)) ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying...
                            </span>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Verify Account
                            </>
                        )}
                    </Button>

                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-500">
                            Didn't receive the code?{" "}
                            <button
                                type="button"
                                className="font-medium text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Resend
                            </button>
                        </p>

                        <Link
                            to="/register"
                            className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Register
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OTP;
