import { Input } from "@/components/ui/input";
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
    <div className="login-page">
      {/* Inline styles for this page */}
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          background-color: #f8f4eb;
          background-image: 
            radial-gradient(circle at 100% 0%, rgba(229, 224, 209, 0.5) 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, rgba(217, 185, 155, 0.3) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(248, 244, 235, 0.8) 0%, transparent 80%);
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
        }

        .login-page * {
          box-sizing: border-box;
        }

        .login-main {
          width: 100%;
          max-width: 72rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 3rem;
          position: relative;
          z-index: 10;
        }

        @media (min-width: 1024px) {
          .login-main {
            flex-direction: row;
            gap: 3rem;
          }
        }

        /* Hero Section */
        .login-hero {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          position: relative;
        }

        @media (min-width: 1024px) {
          .login-hero {
            width: 55%;
          }
        }

        .hero-content {
          max-width: 26rem;
          position: relative;
          z-index: 10;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3.5rem;
        }

        .logo-icon-wrapper {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #f0ecde 0%, #e5e0d1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e5e0d1;
        }

        .logo-text {
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          font-family: 'Inter', sans-serif;
        }

        .hero-heading {
          font-size: 3rem;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: #1a1a1a;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        @media (min-width: 1024px) {
          .hero-heading {
            font-size: 3.5rem;
          }
        }

        .hero-heading .accent-line {
          display: block;
          background: linear-gradient(135deg, #b89767 0%, #d9b99b 50%, #c4956a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          color: #666;
          font-size: 1.1rem;
          line-height: 1.7;
          max-width: 24rem;
          margin-bottom: 2.5rem;
          font-weight: 400;
        }

        .hero-features {
          display: flex;
          gap: 2rem;
        }

        .hero-feature {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .hero-feature-value {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          color: #1a1a1a;
        }

        .hero-feature-label {
          font-size: 0.8rem;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
        }

        /* Decorative Image */
        .hero-image-container {
          width: 280px;
          height: 450px;
          display: none;
          overflow: hidden;
          border-radius: 1rem;
          flex-shrink: 0;
          position: relative;
        }

        @media (min-width: 1024px) {
          .hero-image-container {
            display: block;
          }
        }

        .hero-image-container::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(248, 244, 235, 0.4) 0%, transparent 40%);
          pointer-events: none;
          border-radius: 1rem;
        }

        .hero-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 1rem;
        }

        /* Form Card */
        .form-section {
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 20;
        }

        @media (min-width: 1024px) {
          .form-section {
            width: 50%;
            justify-content: flex-end;
          }
        }

        .form-card {
          width: 100%;
          max-width: 26rem;
          background: rgba(253, 251, 247, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2.5rem;
          border: 1px solid #e5e0d1;
          box-shadow: 
            0 20px 60px -12px rgba(0,0,0,0.08),
            0 0 0 1px rgba(217, 185, 155, 0.1),
            0 0 40px rgba(217, 185, 155, 0.08);
        }

        .form-title {
          font-size: 1.85rem;
          font-family: 'Playfair Display', serif;
          text-align: center;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
          font-weight: 600;
        }

        .form-description {
          text-align: center;
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .form-space {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Custom Input Styling */
        .input-group {
          position: relative;
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid #d4cbb8;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.5);
          padding: 0 1rem;
          height: 3rem;
          transition: all 0.25s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .input-wrapper:focus-within {
          border-color: #b89767;
          box-shadow: 
            inset 0 2px 4px rgba(0,0,0,0.02),
            0 0 0 3px rgba(184, 151, 103, 0.15);
        }

        .input-wrapper .icon {
          color: #999;
          flex-shrink: 0;
          margin-right: 0.75rem;
          transition: color 0.25s ease;
        }

        .input-wrapper:focus-within .icon {
          color: #b89767;
        }

        .input-wrapper input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #1a1a1a;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          padding: 0;
        }

        .input-wrapper input::placeholder {
          color: #aaa;
        }

        .input-wrapper input:disabled {
          opacity: 0.6;
        }

        .toggle-password {
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          padding: 0.25rem;
          margin-left: 0.5rem;
          flex-shrink: 0;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
        }

        .toggle-password:hover {
          color: #1a1a1a;
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #b91c1c;
          font-size: 0.85rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%);
          color: white;
          border: 1px solid #444;
          border-radius: 0.75rem;
          padding: 0.85rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 8px 24px rgba(184, 151, 107, 0.35),
            inset 0 1px 0 rgba(255,255,255,0.1);
          margin-top: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
          transform: translateY(-1px);
          box-shadow: 
            0 12px 32px rgba(184, 151, 107, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .submit-btn .spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 0.5rem;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Forgot Password */
        .forgot-link {
          display: block;
          text-align: right;
          font-size: 0.85rem;
          color: #888;
          text-decoration: none;
          transition: color 0.2s ease;
          margin-top: 0.25rem;
        }

        .forgot-link:hover {
          color: #b89767;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.75rem 0;
        }

        .divider hr {
          flex: 1;
          border: none;
          border-top: 1px solid #e5e0d1;
        }

        .divider span {
          font-size: 0.8rem;
          color: #999;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Sign Up Link */
        .signup-text {
          text-align: center;
          font-size: 0.9rem;
          color: #888;
          margin-top: 1.75rem;
        }

        .signup-text a {
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          padding-bottom: 1px;
        }

        .signup-text a:hover {
          border-bottom-color: #d9b99b;
        }

        /* Decorative Background Elements */
        .bg-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .bg-circle-1 {
          top: -10%;
          right: -5%;
          width: 500px;
          height: 500px;
          border: 0.5px solid rgba(229, 224, 209, 0.5);
          animation: rotateCircle 40s linear infinite;
        }

        .bg-circle-2 {
          bottom: -10%;
          left: -5%;
          width: 400px;
          height: 400px;
          border: 0.5px solid rgba(217, 185, 155, 0.3);
          animation: rotateCircle 30s linear infinite reverse;
        }

        .bg-circle-3 {
          top: 30%;
          right: 20%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(217, 185, 155, 0.08) 0%, transparent 70%);
        }

        @keyframes rotateCircle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Floating decorative dots */
        .floating-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(217, 185, 155, 0.3);
          pointer-events: none;
          animation: float 6s ease-in-out infinite;
        }

        .floating-dot:nth-child(2) { animation-delay: 1s; }
        .floating-dot:nth-child(3) { animation-delay: 2s; }
        .floating-dot:nth-child(4) { animation-delay: 3s; }
        .floating-dot:nth-child(5) { animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* Decorative Background Circles */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-circle bg-circle-3" />

      {/* Floating Dots */}
      <div className="floating-dot" style={{ top: "15%", left: "10%" }} />
      <div className="floating-dot" style={{ top: "70%", left: "25%" }} />
      <div className="floating-dot" style={{ top: "20%", right: "15%" }} />
      <div className="floating-dot" style={{ bottom: "30%", right: "10%" }} />
      <div className="floating-dot" style={{ top: "50%", left: "45%" }} />

      {/* SVG Patterns */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "24rem",
          height: "24rem",
          color: "rgba(229, 224, 209, 0.35)",
          pointerEvents: "none",
          transform: "translate(25%, -25%)",
        }}
        fill="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" />
        <line x1="10" x2="90" y1="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" x2="50" y1="10" y2="90" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "24rem",
          height: "24rem",
          color: "rgba(229, 224, 209, 0.35)",
          pointerEvents: "none",
          transform: "translate(-25%, 25%)",
        }}
        fill="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 0 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      <main className="login-main">
        {/* Left Section — Hero */}
        <section className="login-hero">
          <div className="hero-content" ref={heroRef}>
            {/* Logo */}
            <div className="logo-container">
              <div className="logo-icon-wrapper">
                <Store className="w-5 h-5" style={{ color: "#888" }} />
              </div>
              <span className="logo-text">StoreHub</span>
            </div>

            {/* Heading */}
            <h1 className="hero-heading">
              Welcome Back
              <span className="accent-line">to StoreHub</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              Continue managing your retail empire with elegance and precision.
            </p>

            {/* Stats */}
            <div className="hero-features">
              <div className="hero-feature">
                <span className="hero-feature-value">2.5K+</span>
                <span className="hero-feature-label">Stores</span>
              </div>
              <div className="hero-feature">
                <span className="hero-feature-value">50K+</span>
                <span className="hero-feature-label">Products</span>
              </div>
              <div className="hero-feature">
                <span className="hero-feature-value">99.9%</span>
                <span className="hero-feature-label">Uptime</span>
              </div>
            </div>
          </div>

          {/* Decorative Image */}
          <div className="hero-image-container" ref={imageRef}>
            <img
              src="/retail-interior.png"
              alt="Elegant retail interior"
            />
          </div>
        </section>

        {/* Right Section — Sign In Form */}
        <section className="form-section">
          <div className="form-card" ref={formRef}>
            <h2 className="form-title">Sign In</h2>
            <p className="form-description">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="form-space">
              {/* Error */}
              {error && (
                <div className="error-box">
                  <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="icon w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="icon w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>

              {/* Submit */}
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <hr />
              <span>Or</span>
              <hr />
            </div>

            {/* Sign Up Link */}
            <p className="signup-text">
              Don't have an account?{" "}
              <Link to="/register">Sign Up</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
