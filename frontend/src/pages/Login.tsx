import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, AlertCircle, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

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
    primary: "#0d9488",
    primaryDark: "#115e59",
    primaryLight: "#14b8a6",
    accent: "#134e4a",
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        {/* Background Image */}
        <img
          src="/store-hero.png"
          alt="Store Management"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colors.accent}e6 0%, ${colors.primaryDark}cc 50%, ${colors.primary}99 100%)`
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-md"
              style={{ background: "rgba(255, 255, 255, 0.15)" }}
            >
              <Store className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">StoreHub</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
            Manage Your Store<br />
            <span className="text-teal-200">Effortlessly</span>
          </h1>

          <p className="text-lg text-white/80 max-w-md leading-relaxed">
            Streamline your inventory, track sales, and grow your business with our powerful store management platform.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: "2.5K+", label: "Stores" },
              { value: "50K+", label: "Products" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-teal-200/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: "linear-gradient(180deg, #fffcf5 0%, #fef9f0 50%, #fdf6e8 100%)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})` }}
            >
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: colors.primaryDark }}>StoreHub</span>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-8 shadow-xl border"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderColor: "rgba(13, 148, 136, 0.08)"
            }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ background: "rgba(13, 148, 136, 0.08)" }}
              >
                <Store className="w-4 h-4" style={{ color: colors.primary }} />
                <span className="text-sm font-medium" style={{ color: colors.primaryDark }}>Welcome back</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
              <p className="text-gray-500">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl text-sm"
                  style={{ background: "rgba(239, 68, 68, 0.08)", color: "#dc2626" }}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: colors.primary }} />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl bg-white/80 focus:bg-white transition-colors"
                  style={{ borderColor: "rgba(13, 148, 136, 0.2)" }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: colors.primary }} />
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium hover:underline"
                    style={{ color: colors.primary }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl pr-12 bg-white/80 focus:bg-white transition-colors"
                    style={{ borderColor: "rgba(13, 148, 136, 0.2)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
                  boxShadow: `0 10px 40px -12px ${colors.primary}`
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

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold hover:underline"
                  style={{ color: colors.primary }}
                >
                  Create one for free
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            © 2024 StoreHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
