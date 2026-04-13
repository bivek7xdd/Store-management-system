import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Hero Content Animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, delay: 0.2, ease: "power2.out" }
      );
    }

    // Image entrance
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { scale: 1.05, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
        }
      );
    }

    // Form Animation
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#000000] font-sans text-white selection:bg-[#DA291C] selection:text-white">
      {/* Left Cinematic Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#000000] overflow-hidden">
        {/* Deep Overlay for Chiaroscuro Depth */}
        <div className="absolute inset-0 bg-[hsla(0,0%,7%,0.8)] z-10 pointer-events-none" />
        <img 
          ref={imageRef}
          src="/retail-interior.png" 
          alt="Retail Interior Cinematic" 
          className="w-full h-full object-cover relative z-0"
        />

        <div className="absolute top-12 left-14 z-20 flex items-center gap-3">
          <Store className="w-7 h-7 text-white" />
          <span className="text-[14px] font-medium tracking-[1px] text-white uppercase">StoreHub</span>
        </div>

        <div className="absolute bottom-20 left-14 z-20 max-w-lg" ref={heroRef}>
          <div className="w-12 h-1 bg-[#DA291C] mb-8" />
          <h1 className="text-[26px] md:text-[36px] font-medium leading-[1.15] text-white mb-6">
            Precision Management for Modern Retail
          </h1>
          <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] max-w-sm">
            Experience absolute control over your inventory, sales, and analytics with our refined architecture.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-[#000000]">
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-6 md:left-10 lg:hidden flex items-center gap-3">
          <Store className="w-6 h-6 text-white" />
          <span className="text-[13px] font-medium tracking-[1px] text-white uppercase">StoreHub</span>
        </div>

        <div className="w-full max-w-sm" ref={formRef}>
          <h2 className="text-[26px] font-medium text-white mb-2 tracking-tight">Sign In</h2>
          <p className="text-[#8F8F8F] text-[13px] mb-12 tracking-[0.195px]">
            Enter your credentials to access the system
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-[#F13A2C]/10 border border-[#F13A2C]/30 rounded-[2px] transition-all">
                <AlertCircle className="w-5 h-5 text-[#F13A2C] shrink-0 mt-0.5" />
                <span className="text-[#F13A2C] text-[13px] tracking-[0.195px] leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#8F8F8F] text-[12px] font-normal uppercase tracking-[1px]">
                Email Address
              </Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
                className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] px-3 text-[16px] text-white placeholder:text-[#969696] transition-all focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#8F8F8F] text-[12px] font-normal uppercase tracking-[1px]">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-[#666666] text-[11px] uppercase tracking-[1px] hover:text-[#FFFFFF] transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] pl-3 pr-10 text-[16px] text-white placeholder:text-[#969696] transition-all focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] mt-8 bg-[#DA291C] text-white rounded-[2px] text-[16px] transition-colors hover:bg-[#B01E0A] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[1.28px]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-14 text-center">
            <p className="text-[13px] text-[#8F8F8F] tracking-[0.195px]">
              Don't have an account?{" "}
              <Link to="/register" className="text-white hover:text-[#3860BE] transition-colors font-medium ml-1">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
