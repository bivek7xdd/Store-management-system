import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store, AlertCircle, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, KeyRound } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import api from "@/services/api";

const ResetPassword = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }

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

    if (heroRef.current) {
      gsap.from(heroRef.current.children, {
        y: 25,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        delay: 0.2,
        ease: "power3.out",
      });
    }

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
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
      pastedData.forEach((char, index) => { if (index < 6) newOtp[index] = char; });
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await api.post("/users/reset-password", { email, otp: otpValue, password });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
      setError(msg);
      if (formRef.current) {
        gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000] font-sans p-6">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 rounded-[2px] bg-[#181818] border border-[#303030] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#DA291C]" />
          </div>
          <div className="w-8 h-1 bg-[#DA291C] mx-auto mb-6" />
          <h2 className="text-[24px] font-medium text-white mb-3 tracking-tight">Password Reset Successful</h2>
          <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] mb-8">
            Your password has been updated. You can now sign in with your new credentials.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex w-full bg-[#000000] font-sans text-white selection:bg-[#DA291C] selection:text-white"
    >
      {/* Left Cinematic Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#000000] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#0A0A0A] to-[#111111] z-0" />

        {/* Top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#DA291C] z-20" />

        {/* Corner brackets */}
        <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-[#303030] z-20" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-[#303030] z-20" />

        {/* Logo top left */}
        <div className="absolute top-12 left-14 z-20 flex items-center gap-3">
          <Store className="w-7 h-7 text-white" />
          <span className="text-[14px] font-medium tracking-[1px] text-white uppercase">Store sync</span>
        </div>

        {/* Hero content centered */}
        <div className="absolute inset-0 flex items-center justify-center z-20 px-14">
          <div className="max-w-lg w-full" ref={heroRef}>
            <div className="w-12 h-1 bg-[#DA291C] mb-8" />
            <h1 className="text-[26px] md:text-[34px] font-medium leading-[1.15] text-white mb-6">
              Create Your<br />New Password
            </h1>
            <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] max-w-sm mb-10">
              Enter the 6-digit code sent to your email and choose a strong new password.
            </p>

            {/* Email chip */}
            <div className="p-4 rounded-[2px] bg-[#181818] border border-[#303030]">
              <p className="text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Code sent to</p>
              <p className="text-[14px] text-white font-medium">{email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#000000] relative">
        {/* Mobile top bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[#DA291C] lg:hidden" />

        {/* Mobile logo */}
        <div className="absolute top-8 left-6 md:left-10 lg:hidden flex items-center gap-3">
          <Store className="w-6 h-6 text-white" />
          <span className="text-[13px] font-medium tracking-[1px] text-white uppercase">Store sync</span>
        </div>

        <div ref={formRef} className="w-full max-w-[400px] mt-12 lg:mt-0">

          {/* Header */}
          <div className="mb-10">
            <p className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px] mb-3">Password Recovery</p>
            <h2 className="text-[28px] font-medium text-white tracking-tight leading-[1.2] mb-3">
              Reset Password
            </h2>
            <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px]">
              Enter the 6-digit code and your new password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-[#F13A2C]/10 border-l-2 border-[#F13A2C]">
                <AlertCircle className="h-4 w-4 text-[#F13A2C] shrink-0 mt-0.5" />
                <span className="text-[13px] text-[#F13A2C] tracking-[0.195px]">{error}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">
                Enter 6-Digit Code
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
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-14 text-center text-[20px] font-medium bg-transparent border rounded-[2px] text-white transition-all outline-none
                      ${digit ? 'border-[#DA291C] bg-[#DA291C]/5' : 'border-[#303030] hover:border-[#555555]'}
                      focus:border-[#1EAEDB] focus:ring-2 focus:ring-[#1EAEDB]/20 caret-[#1EAEDB]`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] pl-10 pr-10 text-[16px] text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB] transition-all disabled:opacity-50"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] pl-10 pr-10 text-[16px] text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB] transition-all disabled:opacity-50"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-[#1A1A1A]">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 text-[13px] text-[#8F8F8F] hover:text-white transition-colors tracking-[0.195px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Request New Code
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
