import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";
import { cn } from "@/lib/utils";

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
  const imageRef = useRef<HTMLDivElement>(null);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Hero Content Animation
    if (heroRef.current) {
      gsap.from(heroRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        delay: 0.2,
        ease: "power3.out",
      });
    }

    // Image entrance
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { clipPath: "inset(100% 0 0 0)", opacity: 0 },
        {
          clipPath: "inset(0% 0 0 0)",
          opacity: 1,
          duration: 1.2,
          delay: 0.5,
          ease: "power3.inOut",
        }
      );
    }

    // Form Card Animation
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.6, ease: "power3.out" }
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8f4eb] font-sans text-[#1a1a1a]">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] border-[0.5px] border-[#e5e0d1]/50 rounded-full animate-[spin_40s_linear_infinite]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] border-[0.5px] border-[#d9b99b]/30 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
        <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(217,185,155,0.08)_0%,transparent_70%)] rounded-full" />
        
        {/* Floating Dots */}
        {[
          { top: "15%", left: "10%", delay: "0s" },
          { top: "70%", left: "25%", delay: "1s" },
          { top: "20%", right: "15%", delay: "2s" },
          { bottom: "30%", right: "10%", delay: "3s" },
          { top: "50%", left: "45%", delay: "4s" },
        ].map((dot, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#d9b99b]/30 animate-[float_6s_ease-in-out_infinite]"
            style={{ ...dot, animationDelay: dot.delay }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(229,224,209,0.5)_0%,transparent_40%),radial-gradient(circle_at_0%_100%,rgba(217,185,155,0.3)_0%,transparent_40%),radial-gradient(circle_at_50%_50%,rgba(248,244,235,0.8)_0%,transparent_80%)]" />
      </div>

      {/* SVG Patterns */}
      <svg className="absolute top-0 right-0 w-96 h-96 text-[#e5e0d1]/35 pointer-events-none translate-x-1/4 -translate-y-1/4" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" />
        <line x1="10" x2="90" y1="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" x2="50" y1="10" y2="90" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-96 h-96 text-[#e5e0d1]/35 pointer-events-none -translate-x-1/4 translate-y-1/4" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 0 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Section — Hero */}
        <section className="w-full lg:w-[55%] flex flex-row items-center justify-between gap-8 relative">
          <div className="max-w-md relative z-10" ref={heroRef}>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-14">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f0ecde] to-[#e5e0d1] flex items-center justify-center shadow-sm border border-[#e5e0d1]">
                <Store className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[1.35rem] font-semibold tracking-tight">StoreHub</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-[1.1] mb-6 tracking-tight">
              Welcome Back
              <span className="block bg-gradient-to-br from-[#b89767] via-[#d9b99b] to-[#c4956a] bg-clip-text text-transparent">to StoreHub</span>
            </h1>

            <p className="text-[#666] text-[1.1rem] leading-relaxed max-w-xs mb-10 font-normal">
              Continue managing your retail empire with elegance and precision.
            </p>

            <div className="flex gap-8">
              {[
                { label: "Stores", value: "2.5K+" },
                { label: "Products", value: "50K+" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-2xl font-serif font-bold">{stat.value}</span>
                  <span className="text-[0.8rem] text-[#999] uppercase tracking-widest font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Image */}
          <div className="hidden lg:block w-[280px] h-[450px] overflow-hidden rounded-2xl flex-shrink-0 relative after:absolute after:inset-0 after:bg-gradient-to-t after:from-[#f8f4eb]/40 after:to-transparent after:pointer-events-none" ref={imageRef}>
            <img
              src="/retail-interior.png"
              alt="Elegant retail interior"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </section>

        {/* Right Section — Sign In Form */}
        <section className="w-full lg:w-1/2 flex justify-center lg:justify-end relative z-20">
          <div className="w-full max-w-md bg-white/85 backdrop-blur-[20px] rounded-[1.5rem] p-10 border border-[#e5e0d1] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(217,185,155,0.1),0_0_40px_rgba(217,185,155,0.08)]" ref={formRef}>
            <h2 className="text-[1.85rem] font-serif font-bold text-center mb-2">Sign In</h2>
            <p className="text-center text-[#888] text-sm mb-8">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[0.85rem] font-medium">Email Address</Label>
                <div className="relative group border border-[#d4cbb8] rounded-xl bg-white/50 h-12 flex items-center px-4 transition-all duration-200 focus-within:border-[#b89767] focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_0_0_3px_rgba(184,151,103,0.15)] shadow-inner">
                  <Mail className="w-5 h-5 text-[#999] shrink-0 mr-3 transition-colors group-focus-within:text-[#b89767]" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-transparent border-none outline-none text-[0.9rem] font-sans placeholder:text-[#aaa]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[0.85rem] font-medium">Password</Label>
                <div className="relative group border border-[#d4cbb8] rounded-xl bg-white/50 h-12 flex items-center px-4 transition-all duration-200 focus-within:border-[#b89767] focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_0_0_3px_rgba(184,151,103,0.15)] shadow-inner">
                  <Lock className="w-5 h-5 text-[#999] shrink-0 mr-3 transition-colors group-focus-within:text-[#b89767]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-transparent border-none outline-none text-[0.9rem] font-sans placeholder:text-[#aaa]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 p-1 text-[#999] hover:text-[#1a1a1a] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Link to="/forgot-password" size="sm" className="block text-right text-[0.85rem] text-[#888] hover:text-[#b89767] transition-colors mt-1">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-gradient-to-br from-[#3a3a3a] to-[#1a1a1a] text-white rounded-xl text-[0.95rem] font-medium transition-all duration-300 hover:bg-gradient-to-br hover:from-[#4a4a4a] hover:to-[#2a2a2a] hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(184,151,107,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_rgba(184,151,107,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-7">
              <hr className="flex-1 border-[#e5e0d1]" />
              <span className="text-[0.8rem] text-[#999] uppercase tracking-wider font-medium">Or</span>
              <hr className="flex-1 border-[#e5e0d1]" />
            </div>

            <p className="text-center text-[0.9rem] text-[#888]">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-[#1a1a1a] border-b-2 border-transparent hover:border-[#d9b99b] transition-all">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Login;
