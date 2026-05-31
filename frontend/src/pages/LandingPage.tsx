import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Minus,
  Package,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { Link } from "react-router-dom";
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "@fontsource/inter-tight/800.css";
import "@fontsource/inter-tight/900.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

const fadeInUp = {
  initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15, margin: "-50px" },
  transition: {
    duration: prefersReducedMotion ? 0 : 0.5,
    ease: [0.25, 0, 0, 1] as const,
  },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`;

/* ── Primary Button (text + animated underline) ── */
function PrimaryButton({
  children,
  href,
  size = "default",
}: {
  children: React.ReactNode;
  href?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "py-2 gap-2 text-sm",
    default: "py-3 gap-2.5 text-base",
    lg: "py-4 gap-3 text-lg",
  };

  const content = (
    <button
      className={`inline-flex items-center font-semibold uppercase tracking-wider text-accent ${sizeClasses[size]} active:translate-y-px transition-all duration-150 group`}
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-0.5 bg-accent w-full origin-left scale-x-100 group-hover:scale-x-110 transition-transform duration-150" />
      </span>
      <ArrowRight className="w-4 h-4 stroke-[1.5] transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}

/* ── Outline Button ── */
function OutlineButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <button className="inline-flex items-center px-6 py-3 border border-foreground text-foreground uppercase tracking-wider text-sm font-semibold hover:bg-foreground hover:text-background transition-colors duration-150 active:translate-y-px">
      {children}
    </button>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}

/* ── Ghost Button ── */
function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 text-muted-foreground hover:text-foreground transition-colors duration-150 group relative"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0 left-0 h-px bg-foreground w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-150" />
      </span>
    </button>
  );
}

/* ── Navbar ── */
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-16 py-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tighter text-foreground">
                Store sync
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Testimonials", "Contact"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 relative group"
            >
              {l}
              <span className="absolute -bottom-1 left-0 h-px bg-foreground w-0 group-hover:w-full transition-all duration-150" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Sign In
          </Link>
          <PrimaryButton href="/register" size="sm">
            Join Now
          </PrimaryButton>
        </div>
      </div>
    </nav>
  );
}

/* ── Dashboard Preview ── */
function DashboardPreview() {
  const sidebarItems = [
    { icon: Package, label: "Inventory", badge: "12", active: true },
    { icon: Users, label: "Suppliers" },
    { icon: TrendingUp, label: "Sales" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Shield, label: "Security" },
  ];

  const transactions = [
    {
      desc: "Premium Apparel",
      amount: "-$5,200",
      status: "In-Stock",
      color: "text-[#22c55e]",
    },
    {
      desc: "Wholesale Order",
      amount: "+$12,000",
      status: "Delivered",
      color: "text-[#22c55e]",
    },
    {
      desc: "Supplier Batch",
      amount: "-$8,450",
      status: "Pending",
      color: "text-[#eab308]",
    },
  ];

  return (
    <div className="bg-[#0F0F0F] border border-[#262626] text-[#FAFAFA] flex text-[11px] select-none pointer-events-none h-[340px] md:h-[420px]">
      {/* Sidebar */}
      <div className="w-40 border-r border-[#262626] flex-shrink-0 flex flex-col py-3 px-2.5 hidden md:flex">
        <div className="flex items-center gap-2 px-1.5 mb-4">
          <div className="w-6 h-6 bg-accent text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold">
            SH
          </div>
          <span className="font-semibold text-xs">Store sync</span>
        </div>
        <div className="space-y-0.5">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-1.5 py-1.5 ${item.active ? "bg-[#1A1A1A] font-medium" : "text-[#737373]"}`}
            >
              <item.icon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-accent text-[#0A0A0A] px-1.5 text-[9px] font-bold font-mono">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A1A] text-[#737373] text-[10px]">
              <span>Search products...</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-6 px-2 text-[10px] font-medium border border-[#262626] text-[#FAFAFA]">
              New Sale
            </button>
            <div className="w-6 h-6 bg-accent text-[#0A0A0A] flex items-center justify-center text-[9px] font-bold">
              AR
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 bg-[#0A0A0A]/50 overflow-hidden">
          <p className="text-sm font-semibold mb-3">Dashboard Overview</p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {[
              { label: "Inventory", icon: Package, primary: true },
              { label: "Suppliers", icon: Users },
              { label: "Analytics", icon: TrendingUp },
            ].map((btn) => (
              <span
                key={btn.label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium font-mono uppercase tracking-wide ${
                  btn.primary
                    ? "bg-accent text-[#0A0A0A]"
                    : "bg-[#0F0F0F] text-[#FAFAFA] border border-[#262626]"
                }`}
              >
                <btn.icon className="w-2.5 h-2.5 stroke-[1.5]" />
                {btn.label}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 basis-0 bg-[#0F0F0F] border border-[#262626] p-3">
              <span className="text-[10px] text-[#737373] block mb-1 font-mono uppercase tracking-wide">
                Total Sales
              </span>
              <p className="text-lg font-semibold tracking-tighter">
                $42,190
                <span className="text-xs text-[#737373] font-normal">.50</span>
              </p>
              <div className="mt-1.5 text-[9px] font-medium text-[#22c55e] font-mono">
                +12% VS LAST MONTH
              </div>
            </div>
            <div className="flex-1 basis-0 bg-[#0F0F0F] border border-[#262626] p-3 hidden sm:block">
              <span className="text-[10px] text-[#737373] block mb-1 font-mono uppercase tracking-wide">
                Low Stock
              </span>
              <p className="text-lg font-semibold tracking-tighter text-[#eab308]">
                14{" "}
                <span className="text-xs text-[#737373] font-normal">items</span>
              </p>
              <div className="mt-1.5 text-[9px] font-medium text-[#eab308] font-mono uppercase tracking-wider">
                Requires Action
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="bg-[#0F0F0F] border border-[#262626] p-3">
            <p className="text-[10px] font-medium mb-2 font-mono uppercase tracking-wide">
              Recent Inventory Movements
            </p>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-[#737373] border-b border-[#262626]">
                  <th className="text-left pb-1.5 font-medium font-mono uppercase tracking-wide">Item</th>
                  <th className="text-right pb-1.5 font-medium font-mono uppercase tracking-wide">Value</th>
                  <th className="text-right pb-1.5 font-medium font-mono uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-b border-[#262626] last:border-0">
                    <td className="py-1.5">{t.desc}</td>
                    <td className="py-1.5 text-right font-medium">
                      {t.amount}
                    </td>
                    <td className={`py-1.5 text-right font-medium font-mono ${t.color}`}>
                      {t.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Animated Section Wrapper ── */
function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      {...fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── FAQ Item ── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#262626]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-lg md:text-xl font-medium tracking-tight pr-8 group-hover:text-accent transition-colors duration-150">
          {question}
        </span>
        {open ? (
          <Minus className="w-5 h-5 stroke-[1.5] text-accent flex-shrink-0" />
        ) : (
          <Plus className="w-5 h-5 stroke-[1.5] text-[#737373] flex-shrink-0 group-hover:text-foreground transition-colors duration-150" />
        )}
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-6 text-[#737373] leading-relaxed max-w-3xl">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

/* ── Step Glow (scroll-driven sequential highlight) ── */
function StepGlow({ index, label }: { index: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const start = index * 0.15;
  const end = start + 0.35;
  const opacity = useTransform(scrollYProgress, [start, start + 0.08, end - 0.08, end], [0, 1, 1, 0]);
  const color = useTransform(scrollYProgress, [start, start + 0.04, end - 0.04, end], ["#1A1A1A", "#FF3D00", "#FF3D00", "#1A1A1A"]);

  return (
    <div ref={ref} className="relative inline-block">
      <span className="font-mono text-5xl md:text-6xl font-bold tracking-tighter text-[#1A1A1A]">
        {label}
      </span>
      <motion.span
        style={{ color, opacity }}
        className="absolute inset-0 font-mono text-5xl md:text-6xl font-bold tracking-tighter"
      >
        {label}
      </motion.span>
    </div>
  );
}

/* ── Step Line (scroll-driven color change) ── */
function StepLine({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const start = index * 0.15;
  const end = start + 0.35;
  const opacity = useTransform(scrollYProgress, [start, start + 0.08, end - 0.08, end], [0, 1, 1, 0]);
  const bgColor = useTransform(scrollYProgress, [start, start + 0.04, end - 0.04, end], ["#262626", "#FF3D00", "#FF3D00", "#262626"]);

  return (
    <div ref={ref} className="h-px flex-1 bg-[#262626] relative overflow-hidden">
      <motion.div
        style={{ opacity, backgroundColor: bgColor }}
        className="absolute inset-0 h-px"
      />
    </div>
  );
}

/* ── Heartbeat Sweep Line ── */
function HeartbeatLine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scaleX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.3, 0.7, 0.85, 1], [0, 1, 1, 1, 0, 0]);

  return (
    <div ref={ref} className="relative h-px w-full bg-[#262626] overflow-visible">
      <motion.div
        style={{ scaleX, opacity }}
        className="absolute inset-0 h-0.5 bg-accent origin-left"
      />
      <motion.div
        style={{
          left: useTransform(scrollYProgress, [0.3, 0.7], ["0%", "100%"]),
          opacity,
        }}
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full -ml-1"
        animate={{ scale: [1, 1.8, 1, 1.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: [0.25, 0, 0, 1] }}
      />
      <motion.div
        style={{
          left: useTransform(scrollYProgress, [0.3, 0.7], ["0%", "100%"]),
          opacity,
        }}
        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-accent/20 rounded-full -ml-3 blur-[6px]"
        animate={{ scale: [1, 2, 1, 1.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: [0.25, 0, 0, 1] }}
      />
    </div>
  );
}

/* ── Landing Page ── */
export default function LandingPage() {
  const features = [
    {
      icon: Package,
      title: "Inventory Mastery",
      desc: "Real-time tracking of products, categories, and stock levels across multiple locations.",
    },
    {
      icon: TrendingUp,
      title: "Sales Analytics",
      desc: "Deep insights into revenue, profit margins, and peak periods with AI-driven forecasting.",
    },
    {
      icon: Users,
      title: "Supplier Hub",
      desc: "Manage vendor relationships and supply chain logistics automatically.",
    },
    {
      icon: BarChart3,
      title: "Smart Reporting",
      desc: "Automated daily, weekly, and monthly reports generated instantly with a single tap.",
    },
    {
      icon: Shield,
      title: "Security First",
      desc: "Multi-user access with granular permission controls for every employee role.",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      desc: "Manage your store from anywhere with our responsive dashboard for tablet and mobile.",
    },
  ];

  const testimonials = [
    {
      name: "Ravi Kumar",
      role: "Boutique Owner",
      text: "Store sync changed my life. I used to spend hours on spreadsheets; now everything is automated.",
    },
    {
      name: "Sita Rai",
      role: "Retail Operations",
      text: "The reporting features are second to none. It's the most polished inventory tool I've ever used.",
    },
    {
      name: "Ajay Gurung",
      role: "Store Manager",
      text: "The mobile experience is incredible. I can check stock while I'm on the floor without missing a beat.",
    },
  ];

  const faqs = [
    {
      question: "How long does setup take?",
      answer: "Most stores are fully operational within 30 minutes. Import your existing inventory via CSV, configure your team permissions, and you're ready to go.",
    },
    {
      question: "Can I migrate from my current system?",
      answer: "Yes. We support direct imports from all major POS and inventory platforms. Our migration tool handles products, suppliers, and historical data automatically.",
    },
    {
      question: "What happens when I exceed the free tier?",
      answer: "You'll be notified before any limits are reached. Upgrade seamlessly without losing data or disrupting operations. No surprise charges, ever.",
    },
    {
      question: "Is my data secure?",
      answer: "All data is encrypted at rest and in transit. We use enterprise-grade infrastructure with daily backups and 99.9% uptime guarantee.",
    },
  ];

  return (
    <div className="bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#FF3D00]/20 relative">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ backgroundImage: noiseSvg }}
      />

      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12 lg:px-16 pt-24 pb-20">
        {/* Decorative background number */}
        <div className="absolute top-20 right-12 md:right-24 text-[20rem] md:text-[28rem] font-black text-[#1A1A1A] select-none leading-none pointer-events-none hidden lg:block tracking-tighter">
          01
        </div>

        <div className="max-w-5xl mx-auto relative z-10 w-full">
          <motion.div
            {...staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={fadeInUp.viewport}
            className="flex flex-col items-center"
          >
            {/* Label */}
            <motion.div
              {...fadeInUp}
              className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-8"
            >
              Empowering 2,500+ Retail Experts
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeInUp}
              className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.0] tracking-tighter font-bold max-w-4xl"
            >
              The Future of
              <br />
              <span className="text-accent">Smarter</span> Retailing
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeInUp}
              className="mt-6 md:mt-8 text-center text-base md:text-lg text-[#737373] max-w-xl leading-relaxed"
            >
              Automate inventory, tracking, and sales with intelligent insights
              that grow your business.
            </motion.p>

            {/* CTA */}
            <motion.div
              {...fadeInUp}
              className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center gap-6"
            >
              <PrimaryButton href="/register" size="lg">
                Get Started
              </PrimaryButton>
              <OutlineButton href="#features">See Features</OutlineButton>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2, ease: [0.25, 0, 0, 1] }}
          className="mt-16 md:mt-20 w-full max-w-4xl"
        >
          <DashboardPreview />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 lg:px-16 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            {...staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={fadeInUp.viewport}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {[
              { value: "2,500+", label: "Active Stores" },
              { value: "99.9%", label: "Uptime" },
              { value: "12M+", label: "Transactions" },
              { value: "4.9/5", label: "Satisfaction" },
            ].map((stat, i) => (
              <motion.div key={i} {...fadeInUp} className="text-center md:text-left">
                <p className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-mono uppercase tracking-wider text-[#737373]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 md:py-40 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="mb-16 md:mb-24">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              Features
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1]">
              Everything you need
            </h2>
            <p className="mt-4 md:mt-6 text-[#737373] text-base md:text-lg max-w-2xl leading-relaxed">
              Built for scale, speed, and simplicity. Manage your entire retail
              operation from a single command center.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626]">
            {features.map((f, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                className="bg-[#0A0A0A] p-6 md:p-8 group hover:bg-[#0F0F0F] transition-colors duration-150"
              >
                <f.icon className="w-6 h-6 md:w-7 md:h-7 stroke-[1.5] text-[#737373] group-hover:text-accent transition-colors duration-150 mb-6" />
                <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3 group-hover:text-accent transition-colors duration-150">
                  {f.title}
                </h3>
                <p className="text-[#737373] leading-relaxed text-sm md:text-base">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 md:py-40 px-6 md:px-12 lg:px-16 border-t border-[#262626] bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="mb-16 md:mb-24">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              Process
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1]">
              How it works
            </h2>
          </AnimatedSection>

          {/* Mobile: stacked */}
          <div className="flex flex-col gap-12 lg:hidden">
            {[
              {
                step: "01",
                title: "Connect",
                desc: "Import your inventory and connect your existing systems in minutes.",
              },
              {
                step: "02",
                title: "Automate",
                desc: "Set rules for reordering, alerts, and reporting that run on autopilot.",
              },
              {
                step: "03",
                title: "Scale",
                desc: "Watch your operations streamline as intelligent insights drive growth.",
              },
            ].map((s, i) => (
              <motion.div key={i} {...fadeInUp} className="group">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono text-5xl md:text-6xl font-bold text-[#1A1A1A] group-hover:text-[#262626] transition-colors duration-150 tracking-tighter">
                    {s.step}
                  </span>
                  <div className="h-px flex-1 bg-[#262626] group-hover:bg-accent transition-colors duration-150" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3">
                  {s.title}
                </h3>
                <p className="text-[#737373] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Desktop: 3 columns with sequential step glow */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:items-start lg:gap-12">
            <motion.div {...fadeInUp} className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <StepGlow index={0} label="01" />
                <StepLine index={0} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3">
                Connect
              </h3>
              <p className="text-[#737373] leading-relaxed">Import your inventory and connect your existing systems in minutes.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <StepGlow index={1} label="02" />
                <StepLine index={1} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3">
                Automate
              </h3>
              <p className="text-[#737373] leading-relaxed">Set rules for reordering, alerts, and reporting that run on autopilot.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <StepGlow index={2} label="03" />
                <StepLine index={2} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3">
                Scale
              </h3>
              <p className="text-[#737373] leading-relaxed">Watch your operations streamline as intelligent insights drive growth.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 md:py-40 px-6 md:px-12 lg:px-16 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="mb-16 md:mb-24">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1]">
              Loved by retailers
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626]">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                className="bg-[#0A0A0A] p-6 md:p-8 group hover:bg-[#0F0F0F] transition-colors duration-150"
              >
                <blockquote className="font-serif text-lg md:text-xl leading-snug italic mb-8 text-[#FAFAFA]/90">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className="pt-4 border-t border-[#262626]">
                  <p className="font-semibold text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#737373] mt-1">
                    {t.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28 md:py-40 px-6 md:px-12 lg:px-16 border-t border-[#262626] bg-[#0F0F0F]">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection className="mb-16">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              FAQ
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.1]">
              Common questions
            </h2>
          </AnimatedSection>

          <motion.div
            {...staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={fadeInUp.viewport}
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} {...fadeInUp}>
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="contact" className="py-28 md:py-40 px-6 md:px-12 lg:px-16 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            {...staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={fadeInUp.viewport}
            className="text-center"
          >
            <motion.p
              {...fadeInUp}
              className="font-mono text-xs uppercase tracking-widest text-accent mb-6"
            >
              Get Started
            </motion.p>
            <motion.h2
              {...fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-[1.0] max-w-3xl mx-auto"
            >
              Ready to scale
              <br />
              your empire?
            </motion.h2>
            <motion.p
              {...fadeInUp}
              className="mt-6 md:mt-8 text-[#737373] text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            >
              Join thousands of growing retail brands using Store sync to automate
              their success.
            </motion.p>
            <motion.div
              {...fadeInUp}
              className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <PrimaryButton href="/register" size="lg">
                Start Free Trial
              </PrimaryButton>
              <GhostButton>Contact Sales</GhostButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 md:py-20 px-6 md:px-12 lg:px-16 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 mb-16">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
              <span className="text-xl font-bold tracking-tighter">
          Store sync
              </span>
              <p className="mt-3 text-sm text-[#737373] leading-relaxed max-w-xs">
                Intelligent inventory and retail management for modern businesses.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">
                Product
              </p>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Changelog"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#737373] hover:text-foreground transition-colors duration-150">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">
                Company
              </p>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Press"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#737373] hover:text-foreground transition-colors duration-150">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">
                Legal
              </p>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Security", "GDPR"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#737373] hover:text-foreground transition-colors duration-150">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">
                Connect
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#737373] hover:text-foreground transition-colors duration-150">
                  <Twitter className="w-[18px] h-[18px] stroke-[1.5]" />
                </a>
                <a href="#" className="text-[#737373] hover:text-foreground transition-colors duration-150">
                  <Linkedin className="w-[18px] h-[18px] stroke-[1.5]" />
                </a>
                <a href="#" className="text-[#737373] hover:text-foreground transition-colors duration-150">
                  <Github className="w-[18px] h-[18px] stroke-[1.5]" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#262626] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#737373] font-mono">
              &copy; 2026 Store sync Inc. All rights reserved.
            </p>
            <p className="text-xs text-[#737373] font-mono">
              Designed with type. Built with purpose.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
