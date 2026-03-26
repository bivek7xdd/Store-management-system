import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Play, ChevronDown, Search, Bell, ChevronRight, Check, Plus,
  MoreHorizontal, Send, ArrowDownLeft, ArrowUpRight, Landmark,
  CreditCard, FileText, Home, ListChecks, Wallet,
  Settings as SettingsIcon, BellRing, Route, Package, TrendingUp, Users, BarChart3, Shield, Smartphone, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";

const fade = (delay: number, y = 16) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

/* ── Navbar ── */
function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-8 py-3 font-body backdrop-blur-3xl bg-white/[0.08] border-t border-white/30 border-x border-white/10 border-b border-white/5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all w-[90%] max-w-6xl mx-auto">
      <div className="flex items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">SH</div>
        <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">✦ StoreHub</span>
      </div>
      <div className="hidden md:flex items-center gap-10 bg-white/5 dark:bg-black/20 px-8 py-2.5 rounded-full border border-white/10 backdrop-blur-xl">
        {["Features", "Testimonials", "Contact"].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:scale-105 active:scale-95">{l}</a>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors pr-2">Sign In</Link>
        <Link to="/register">
          <Button className="rounded-full px-7 h-11 text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            Join Now
          </Button>
        </Link>
      </div>
    </nav>
  );
}

/* ── Dashboard Preview (coded) ── */
function DashboardPreview() {
  const sidebarItems = [
    { icon: Home, label: "Home", active: true },
    { icon: ListChecks, label: "Inventory", badge: "12" },
    { icon: ArrowUpRight, label: "Sales" },
    { icon: Wallet, label: "Finance", chevron: true },
    { icon: BarChart3, label: "Analytics" },
    { icon: Users, label: "Suppliers" },
    { icon: SettingsIcon, label: "Config", chevron: true },
  ];

  const workflowItems = [
    { icon: Route, label: "Stock Routes" },
    { icon: Wallet, label: "Re-orders" },
    { icon: BellRing, label: "Alerts" },
  ];

  const transactions = [
    { date: "Mar 15", desc: "Premium Apparel", amount: "-$5,200", status: "In-Stock", color: "text-emerald-500" },
    { date: "Mar 14", desc: "Wholesale Order", amount: "+$12,000", status: "Delivered", color: "text-emerald-500" },
    { date: "Mar 13", desc: "Supplier Batch", amount: "-$8,450", status: "Pending", color: "text-amber-500" },
  ];

  return (
    <div className="rounded-xl bg-background border border-border text-foreground flex overflow-hidden text-[11px] select-none pointer-events-none h-[340px] md:h-[420px]">
      {/* Sidebar */}
      <div className="w-40 border-r border-border flex-shrink-0 flex flex-col py-3 px-2.5 hidden md:flex bg-muted/20">
        <div className="flex items-center gap-2 px-1.5 mb-4">
          <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold">SH</div>
          <span className="font-semibold text-xs">StoreHub</span>
          <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          {sidebarItems.map((item) => (
            <div key={item.label} className={`flex items-center gap-2 px-1.5 py-1.5 rounded-md ${item.active ? "bg-secondary font-medium" : "text-muted-foreground"}`}>
              <item.icon className="w-3.5 h-3.5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && <span className="bg-accent text-accent-foreground rounded-full px-1.5 text-[9px] font-medium">{item.badge}</span>}
              {item.chevron && <ChevronRight className="w-3 h-3" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-muted-foreground text-[10px]">
              <Search className="w-3 h-3" />
              <span>Search products...</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-6 rounded-md px-2 text-[10px] font-medium">New Sale</Button>
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[9px] font-semibold">AR</div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 bg-secondary/10 overflow-hidden">
          <p className="text-sm font-semibold mb-3">Dashboard Overview</p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {[
              { label: "Inventory", icon: Package, primary: true },
              { label: "Suppliers", icon: Users },
              { icon: TrendingUp, label: "Analytics" },
              { label: "Reports", icon: FileText },
            ].map((btn) => (
              <span key={btn.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${btn.primary ? "bg-accent text-accent-foreground" : "bg-background text-foreground border border-border"}`}>
                <btn.icon className="w-2.5 h-2.5" />{btn.label}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 basis-0 bg-background rounded-xl border border-border p-3 shadow-sm">
              <span className="text-[10px] text-muted-foreground block mb-1">Total Sales</span>
              <p className="text-lg font-semibold tracking-tight">$42,190<span className="text-xs text-muted-foreground">.50</span></p>
              <div className="flex gap-2 mt-1.5 text-[9px] font-medium">
                <span className="text-emerald-500">+12% vs last month</span>
              </div>
            </div>
            <div className="flex-1 basis-0 bg-background rounded-xl border border-border p-3 shadow-sm hidden sm:block">
              <span className="text-[10px] text-muted-foreground block mb-1">Low Stock Alerts</span>
              <p className="text-lg font-semibold tracking-tight text-amber-500">14 <span className="text-xs text-muted-foreground font-normal">items</span></p>
              <div className="flex gap-2 mt-1.5 text-[9px] font-medium">
                <span className="text-amber-500 uppercase tracking-wider">Requires Action</span>
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="bg-background rounded-xl border border-border p-3 shadow-sm">
            <p className="text-[10px] font-medium mb-2">Recent Inventory Movements</p>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-1.5 font-medium">Item</th>
                  <th className="text-right pb-1.5 font-medium">Value</th>
                  <th className="text-right pb-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-1.5">{t.desc}</td>
                    <td className="py-1.5 text-right font-medium">{t.amount}</td>
                    <td className={`py-1.5 text-right font-medium ${t.color}`}>{t.status}</td>
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
function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 1, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Card Deck Item (Sticky Stack) ── */
function FeatureStackCard({ items, index, total, className = "" }: { items: any[]; index: number; total: number; className?: string }) {
  return (
    <div className="sticky top-40 mb-20 w-full px-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.8 }}
        className="w-full bg-[#0c0c0e/90] backdrop-blur-[64px] rounded-[4rem] border border-white/10 shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 opacity-60" />

        <div className="relative z-10 w-full p-10 md:p-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full">
            {items.map((f, i) => (
              <div key={i} className="flex flex-col justify-center p-12 rounded-[3.5rem] bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all duration-700 relative overflow-hidden group/card shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-10 text-white shadow-2xl shadow-primary/40 relative z-10">
                  <f.icon className="w-10 h-10" />
                </div>
                <h3 className={`text-5xl font-black mb-6 tracking-tighter uppercase relative z-10 ${className || "text-white"}`}>{f.title}</h3>
                <p className={`leading-relaxed text-2xl font-medium tracking-tight relative z-10 ${className || "text-zinc-300"}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Landing Page ── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  const featureGroups = [
    {
      items: [
        { icon: Package, title: "Inventory Mastery", desc: "Real-time tracking of products, categories, and stock levels across multiple locations.", colSpan: "md:col-span-3" },
        { icon: TrendingUp, title: "Sales Analytics", desc: "Gain deep insights into your revenue, profit margins, and peak periods with AI-driven forecasting.", colSpan: "md:col-span-3" },
      ]
    },
    {
      items: [
        { icon: Users, title: "Supplier Hub", desc: "Effortlessly manage vendor relationships and supply chain logistics automatically.", colSpan: "md:col-span-3" },
        { icon: BarChart3, title: "Smart Reporting", desc: "Automated daily, weekly, and monthly reports generated instantly with a single tap.", colSpan: "md:col-span-3" },
      ]
    },
    {
      items: [
        { icon: Shield, title: "Security First", desc: "Secure multi-user access with granular permission controls for every employee role.", colSpan: "md:col-span-3" },
        { icon: Smartphone, title: "Mobile Ready", desc: "Manage your store from anywhere with our fully responsive dashboard tailored for tablet and mobile.", colSpan: "md:col-span-3" },
      ]
    }
  ];

  return (
    <div className="bg-background text-foreground font-sans selection:bg-primary/20 relative">
      {/* Noise Overlay */}
      <div className="fixed inset-0 z-[100] opacity-[0.03] pointer-events-none bg-[url('https://grain-y.vercel.app/noise.svg')] mix-blend-overlay" />

      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center overflow-hidden px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

          <motion.div
            animate={{
              x: [0, 200, 0],
              y: [0, -150, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-600/30 blur-[150px] rounded-full"
          />
          <motion.div
            animate={{
              x: [0, -200, 0],
              y: [0, 150, 0],
              scale: [1, 1.4, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/30 blur-[150px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-emerald-500/10 blur-[160px] rounded-full"
          />
        </div>


        {/* Background video overlay */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        {/* Hero Content */}
        <motion.div style={{ y: heroY }} className="relative z-10 flex flex-col items-center pt-32 md:pt-40 max-w-5xl text-foreground">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-2 text-xs font-bold text-primary uppercase tracking-widest mb-10 shadow-2xl"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Empowering 2,500+ Retailing Experts
          </motion.div>

          {/* Headline */}
          <motion.h1 {...fade(0.1)} className="text-center font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tighter max-w-5xl px-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/40 pb-4">
            The Future of <br />
            <span className="italic font-serif text-primary relative">
              Smarter
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-2 left-0 h-[2px] bg-primary/40 rounded-full"
              />
            </span> Retailing
          </motion.h1>

          {/* Subheadline */}
          <motion.p {...fade(0.2)} className="mt-6 text-center text-lg md:text-2xl text-muted-foreground/80 max-w-2xl leading-relaxed">
            Automate your inventory, tracking, and sales with intelligent insights that grow your business.
          </motion.p>

          {/* CTA */}
          <motion.div {...fade(0.3)} className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-10 h-16 text-lg font-bold shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                Get Started for Free
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-16 text-lg font-medium bg-background/20 backdrop-blur-xl border-white/10 hover:bg-white/5 transition-all">
                See Features
              </Button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-16 w-16 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg flex items-center justify-center group transition-colors hover:bg-white/10"
              >
                <Play className="h-6 w-6 fill-primary text-primary group-hover:scale-110 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Dashboard Preview */}
        <motion.div
          style={{ y: dashboardY }}
          className="relative z-10 mt-16 w-full max-w-6xl px-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="rounded-[2.5rem] overflow-hidden p-1.5 bg-gradient-to-br from-white/30 via-white/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-white/20 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-3xl">
            <div className="rounded-[2.3rem] overflow-hidden bg-background/40">
              <DashboardPreview />
            </div>
          </div>
          {/* Floating Accents */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/30 blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 blur-3xl opacity-50" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 px-6 md:px-12 lg:px-20 relative bg-muted/20">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-24">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              Features
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-semibold tracking-tight mb-6 text-zinc-500">Everything you need</h2>
            <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">Built for scale, speed, and simplicity. Manage your entire retail empire from a single intuitive command center.</p>
          </AnimatedSection>

          <div className="flex flex-col items-center ">
            {featureGroups.map((group, index) => (
              <FeatureStackCard
                className="text-zinc-400"
                key={index}
                items={group.items}
                index={index}
                total={featureGroups.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-32 px-6 md:px-12 lg:px-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4 text-zinc-500">Loved by Retailers</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">See why business owners across the globe are switching to StoreHub.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "Boutique Owner", text: "StoreHub changed my life. I used to spend hours on spreadsheets; now everything is automated." },
              { name: "David Chen", role: "Retail Operations", text: "The reporting features are second to none. It's the most polished inventory tool I've ever used." },
              { name: "Michael Ross", role: "Store Manager", text: "The mobile experience is incredible. I can check stock while I'm on the floor without missing a beat." }
            ].map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="p-10 rounded-[2.5rem] bg-secondary/20 backdrop-blur-md border border-white/5 relative group hover:bg-secondary/30 transition-all duration-500">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-zinc-400 text-zinc-400" />)}
                </div>
                <p className="text-xl font-medium leading-relaxed mb-8 text-foreground/90">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-zinc-500 flex items-center justify-center font-bold text-zinc-900 shadow-lg">{t.name[0]}</div>
                  <div>
                    <p className="font-bold text-base text-foreground">{t.name}</p>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide uppercase">{t.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <AnimatedSection className="max-w-6xl mx-auto rounded-[4rem] bg-foreground text-background p-16 md:p-28 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-purple-600/30 opacity-20" />
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-display font-bold mb-8 tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-emerald-400">Ready to scale <br />your empire?</h2>
            <p className="text-white/60 text-xl md:text-2xl mb-14 max-w-2xl mx-auto font-body leading-relaxed">Join the world's fastest-growing retail brands using StoreHub to automate their success.</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="rounded-full px-12 h-20 text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90 border-0">
                Start Free Trial Now
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/40 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/20 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" />

        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-[10px]">SH</div>
            <span className="font-bold">StoreHub</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
            <a href="#" className="hover:text-foreground">LinkedIn</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 StoreHub Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
