import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Store, AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import SpaceBackground from "@/components/SpaceBackground";
import api from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Left Content Animation
    if (contentRef.current) {
      gsap.from(contentRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        delay: 0.2,
        ease: "power2.out"
      });
    }

    // Form Entry Animation
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 0.5, ease: "power3.out" }
      );
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
      setError(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    primary: "#0d9488", // Teal 600
    primaryGlow: "rgba(13, 148, 136, 0.5)",
  };

  return (
    <SpaceBackground className="flex">
      {/* Left Panel - Hero Content */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10">
        <div ref={contentRef} className="text-white">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-md"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
            >
              <Store className="h-8 w-8 text-teal-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight">StoreHub</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight shadow-teal-500/20 drop-shadow-lg">
            Forgot Your<br />
            <span className="text-teal-400">Password?</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-md leading-relaxed">
            No worries! Enter your email address and we'll send you a code to reset your password.
          </p>

          {/* Security Tips */}
          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Secure Reset Process</p>
                <p className="text-xs text-gray-400">We'll send a 6-digit code to your email</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Code Expires in 10 Minutes</p>
                <p className="text-xs text-gray-400">For your security, the reset code is time-limited</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 backdrop-blur-sm lg:backdrop-blur-none bg-black/30 lg:bg-transparent">
        <div
          ref={formRef}
          className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl"
          style={{
            background: "rgba(15, 23, 42, 0.7)",
          }}
        >
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Store className="h-6 w-6 text-teal-400" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-teal-500/10 border border-teal-500/20">
              <Mail className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-300">Password Recovery</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Enter your email to receive a reset code</p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <CheckCircle className="w-12 h-12 text-teal-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-400 mb-4">
                  We've sent a 6-digit reset code to <span className="text-teal-400 font-medium">{email}</span>
                </p>
              </div>
              <Button
                onClick={() => navigate("/reset-password", { state: { email } })}
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, #059669 100%)`,
                  boxShadow: `0 0 20px ${colors.primaryGlow}`
                }}
              >
                Enter Reset Code
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, #059669 100%)`,
                  boxShadow: `0 0 20px ${colors.primaryGlow}`
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-teal-400 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
};

export default ForgotPassword;
