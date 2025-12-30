import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import gsap from "gsap";
import SpaceBackground from "@/components/SpaceBackground";

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
  const contentRef = useRef<HTMLDivElement>(null);

  const from = location.state?.from?.pathname || "/";

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
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
            Manage Your Store<br />
            <span className="text-teal-400">Effortlessly</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-md leading-relaxed">
            Streamline your inventory, track sales, and grow your business with our powerful store management platform.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: "2.5K+", label: "Stores" },
              { value: "50K+", label: "Products" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-teal-200/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 backdrop-blur-sm lg:backdrop-blur-none bg-black/30 lg:bg-transparent">
        {/* Glass Panel only on Left edge if desired, or just centered form */}
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
              <Store className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-300">Welcome back</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-gray-400">Enter your credentials to access your dashboard</p>
          </div>

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Link to="/forgot-password" className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
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
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline">
                Create one for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
};

export default Login;
