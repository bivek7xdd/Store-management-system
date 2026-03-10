import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store, AlertCircle, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import SpaceBackground from "@/components/SpaceBackground";
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
  const formRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const email = location.state?.email || "";

  useEffect(() => {
    // If no email, redirect to forgot password
    if (!email) {
      navigate("/forgot-password");
      return;
    }

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

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
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
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/reset-password", {
        email,
        otp: otpValue,
        password
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
      // Shake animation for error
      if (formRef.current) {
        gsap.from(formRef.current, { x: 5, duration: 0.1, repeat: 3, yoyo: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    primary: "#0d9488",
    primaryGlow: "rgba(13, 148, 136, 0.5)",
  };

  if (success) {
    return (
      <SpaceBackground className="flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl text-center"
          style={{ background: "rgba(15, 23, 42, 0.7)" }}>
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-teal-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h2>
          <p className="text-gray-400 mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, #059669 100%)`,
              boxShadow: `0 0 20px ${colors.primaryGlow}`
            }}
          >
            Sign In
          </Button>
        </div>
      </SpaceBackground>
    );
  }

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
            Create Your<br />
            <span className="text-teal-400">New Password</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-md leading-relaxed">
            Enter the 6-digit code sent to your email and choose a new secure password.
          </p>

          {/* Info Box */}
          <div className="mt-12 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-sm text-gray-400">
              <span className="text-teal-400 font-medium">Code sent to:</span><br />
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
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
              <Lock className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-300">Set New Password</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Enter the code and your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="space-y-2">
              <Label className="text-gray-300">Enter 6-Digit Code</Label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-white/10 bg-white/5 text-white focus:border-teal-500 focus:ring-teal-500 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, #059669 100%)`,
                boxShadow: `0 0 20px ${colors.primaryGlow}`
              }}
              disabled={loading || otp.some(d => !d)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link to="/forgot-password" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-teal-400 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Request New Code
            </Link>
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
};

export default ResetPassword;
