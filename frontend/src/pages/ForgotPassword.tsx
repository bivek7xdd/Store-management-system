import { Link, useNavigate } from "react-router-dom";
import { Store, AlertCircle, Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import api from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/users/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset code. Please try again.";
      setError(msg);
      if (formRef.current) {
        gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex w-full bg-[#000000] font-sans text-white selection:bg-[#DA291C] selection:text-white"
    >
      {/* Left Cinematic Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#000000] overflow-hidden">
        <div className="absolute inset-0 bg-[hsla(0,0%,4%,0.85)] z-10 pointer-events-none" />
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
            Forgot Your<br />Password?
          </h1>
          <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] max-w-sm mb-10">
            No worries. Enter your email address and we'll send you a secure reset code.
          </p>

          <div className="flex flex-col gap-5">
            {[
              { label: "Secure Reset Process", desc: "We'll send a 6-digit code to your verified email" },
              { label: "Code Expires in 10 Minutes", desc: "For your security, the reset code is time-limited" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle className="w-4 h-4 text-[#DA291C] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-white">{item.label}</p>
                  <p className="text-[12px] text-[#8F8F8F] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
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
            <p className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px] mb-3">Account Recovery</p>
            <h2 className="text-[28px] font-medium text-white tracking-tight leading-[1.2] mb-3">
              Reset Password
            </h2>
            <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px]">
              Enter your email to receive a reset code
            </p>
          </div>

          {success ? (
            /* Success State */
            <div className="space-y-6">
              <div className="p-5 rounded-[2px] bg-[#181818] border border-[#303030] flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-[2px] bg-[#DA291C]/10 border border-[#DA291C]/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-[#DA291C]" />
                </div>
                <h3 className="text-[16px] font-medium text-white mb-2">Check Your Email</h3>
                <p className="text-[13px] text-[#8F8F8F] leading-[1.6]">
                  We've sent a 6-digit reset code to
                </p>
                <p className="text-white text-[14px] font-medium mt-1">{email}</p>
              </div>

              <button
                onClick={() => navigate("/reset-password", { state: { email } })}
                className="w-full h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Enter Reset Code
              </button>

              <div className="text-center pt-4 border-t border-[#1A1A1A]">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[13px] text-[#8F8F8F] hover:text-white transition-colors tracking-[0.195px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3 bg-[#F13A2C]/10 border-l-2 border-[#F13A2C]">
                  <AlertCircle className="h-4 w-4 text-[#F13A2C] shrink-0 mt-0.5" />
                  <span className="text-[13px] text-[#F13A2C] tracking-[0.195px]">{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] pl-10 pr-3 text-[16px] text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB] transition-all disabled:opacity-50"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </button>

              <div className="text-center pt-4 border-t border-[#1A1A1A]">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[13px] text-[#8F8F8F] hover:text-white transition-colors tracking-[0.195px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
