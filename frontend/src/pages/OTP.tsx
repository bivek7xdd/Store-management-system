import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Shield, RotateCcw } from "lucide-react";
import gsap from "gsap";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const OTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const email = location.state?.email || "your email";

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(
            containerRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.6 }
        ).fromTo(
            formRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
            "-=0.3"
        );

        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
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
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length !== 6) return;

        setIsSubmitting(true);

        try {
            await api.post("/users/verify-otp", {
                userEmail: email,
                otp: otpValue,
                purpose: "email_verification"
            });

            setIsSubmitting(false);

            toast({
                title: "Success",
                description: "Account verified successfully! Please log in.",
            });

            localStorage.setItem("storehub_tour_pending", "true");
            navigate("/login", { state: { message: "Account verified successfully! Please log in." } });

        } catch (error: any) {
            setIsSubmitting(false);

            const errorMessage = error.response?.data?.error || "Verification failed. Invalid or expired OTP.";
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: errorMessage,
            });

            if (formRef.current) {
                gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" });
            }

            // Clear OTP inputs on error
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await api.post("/users/resend-otp", { userEmail: email });
            setResendCooldown(60);
            toast({ title: "Code Resent", description: "A new verification code has been sent to your email." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to resend code. Please try again." });
        }
    };

    const isComplete = otp.every(d => d !== "");

    return (
        <div
            ref={containerRef}
            className="min-h-screen flex w-full bg-[#000000] font-sans text-white selection:bg-[#DA291C] selection:text-white"
        >
            {/* Left Cinematic Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#000000] overflow-hidden">
                <div className="absolute inset-0 bg-[hsla(0,0%,4%,0.85)] z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#0A0A0A] to-[#111111] z-0" />

                {/* Geometric accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#DA291C] z-20" />

                {/* Shield Icon centered */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-[2px] border border-[#303030] bg-[#181818] flex items-center justify-center mx-auto mb-8">
                            <Shield className="w-10 h-10 text-[#DA291C]" />
                        </div>
                        <div className="w-8 h-1 bg-[#DA291C] mx-auto mb-6" />
                        <h1 className="text-[28px] font-medium text-white tracking-tight leading-[1.2] mb-4">
                            Two-Factor<br />Verification
                        </h1>
                        <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] max-w-[260px] mx-auto">
                            Your security is our priority. Enter the code we sent to complete identity verification.
                        </p>
                    </div>
                </div>

                {/* Bottom brand */}
                <div className="absolute bottom-12 left-14 z-20">
                    <span className="text-[12px] font-medium tracking-[1.5px] text-[#8F8F8F] uppercase">StoreHub</span>
                </div>

                {/* Subtle corner lines */}
                <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-[#303030] z-20" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-[#303030] z-20" />
            </div>

            {/* Right Form Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#000000] relative">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-px bg-[#DA291C] lg:hidden" />

                {/* Mobile Logo */}
                <div className="absolute top-8 left-6 md:left-10 lg:hidden flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#DA291C]" />
                    <span className="text-[13px] font-medium tracking-[1px] text-white uppercase">StoreHub</span>
                </div>

                <div ref={formRef} className="w-full max-w-[400px] mt-12 lg:mt-0">

                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px] mb-3">Account Verification</p>
                        <h2 className="text-[28px] font-medium text-white tracking-tight leading-[1.2] mb-4">
                            Verify Your Email
                        </h2>
                        <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px]">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-white text-[14px] font-medium mt-1 tracking-[0.195px]">{email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* OTP Input Grid */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">
                                Enter Confirmation Code
                            </label>
                            <div className="flex justify-between gap-2 mt-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        className={`w-12 h-14 text-center text-[20px] font-medium bg-transparent border rounded-[2px] text-white transition-all outline-none
                                            ${digit
                                                ? 'border-[#DA291C] bg-[#DA291C]/5'
                                                : 'border-[#303030] hover:border-[#555555]'
                                            }
                                            focus:border-[#1EAEDB] focus:ring-2 focus:ring-[#1EAEDB]/20
                                            caret-[#1EAEDB]`}
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isComplete}
                            className="w-full h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Verify Account
                                </>
                            )}
                        </button>

                        {/* Resend + Back */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-[#1A1A1A]" />
                                <span className="text-[11px] text-[#8F8F8F] uppercase tracking-[1px]">or</span>
                                <div className="flex-1 h-px bg-[#1A1A1A]" />
                            </div>

                            <div className="text-center">
                                <p className="text-[13px] text-[#8F8F8F] tracking-[0.195px]">
                                    Didn't receive the code?
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className="mt-2 inline-flex items-center gap-2 text-[13px] text-white hover:text-[#1EAEDB] transition-colors disabled:text-[#8F8F8F] disabled:cursor-not-allowed uppercase tracking-[1px] font-normal"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                </button>
                            </div>

                            <div className="text-center pt-2 border-t border-[#1A1A1A]">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-2 text-[13px] text-[#8F8F8F] hover:text-white transition-colors tracking-[0.195px]"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to Register
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OTP;
