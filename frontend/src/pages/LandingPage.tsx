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
    <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body relative z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">SM</div>
        <span className="text-xl font-semibold tracking-tight text-foreground">✦ StoreHub</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {["Features", "Pricing", "Testimonials", "Contact"].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
        <Link to="/register">
          <Button className="rounded-full px-5 text-sm font-medium">Get Started</Button>
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
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Landing Page ── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div className="bg-background text-foreground font-sans selection:bg-primary/20">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center overflow-hidden px-4">
        {/* Background video overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
           <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        {/* Hero Content */}
        <motion.div style={{ y: heroY }} className="relative z-10 flex flex-col items-center pt-16 md:pt-24 max-w-5xl text-foreground">
          {/* Badge */}
          <motion.div {...fade(0)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground font-medium mb-8">
            The next-gen retail management hub 🚀
          </motion.div>

          {/* Headline */}
          <motion.h1 {...fade(0.1)} className="text-center font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter max-w-4xl px-4">
            The Future of <em className="italic font-serif">Smarter</em> Retailing
          </motion.h1>

          {/* Subheadline */}
          <motion.p {...fade(0.2)} className="mt-8 text-center text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Automate your inventory, tracking, and sales with intelligent insights that grow your business—so you can focus on building your empire.
          </motion.p>

          {/* CTA */}
          <motion.div {...fade(0.3)} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/20">Get Started for Free</Button>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" className="rounded-full px-6 h-14 text-base font-medium bg-background/40 backdrop-blur-sm border-border">
                See Features
              </Button>
              <Button variant="ghost" className="h-14 w-14 rounded-full border-0 bg-background shadow-lg hover:bg-background/80 p-0 flex items-center justify-center">
                <Play className="h-5 w-5 fill-foreground" />
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Dashboard Preview */}
        <motion.div style={{ y: dashboardY }} className="relative z-10 mt-20 w-full max-w-5xl px-4">
          <div className="rounded-2xl overflow-hidden p-2 md:p-3 bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 shadow-2xl backdrop-blur-xl">
            <DashboardPreview />
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 md:px-12 lg:px-20 relative overflow-hidden bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to manage your inventory, sales, and suppliers in one place.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Package, title: "Inventory Mastery", desc: "Real-time tracking of products, categories, and stock levels." },
              { icon: TrendingUp, title: "Sales Analytics", desc: "Gain deep insights into your revenue, profit margins, and peak periods." },
              { icon: Users, title: "Supplier Hub", desc: "Effortlessly manage vendor relationships and supply chain logistics." },
              { icon: BarChart3, title: "Smart Reporting", desc: "Automated daily, weekly, and monthly reports generated instantly." },
              { icon: Shield, title: "Role-Based Security", desc: "Secure multi-user access with granular permission controls." },
              { icon: Smartphone, title: "Mobile Ready", desc: "Manage your store from anywhere with our responsive dashboard." }
            ].map((f, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="bg-background p-8 rounded-2xl border border-border hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4">Loved by Retailers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">See why business owners across the globe are switching to StoreHub.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "Boutique Owner", text: "StoreHub changed my life. I used to spend hours on spreadsheets; now everything is automated." },
              { name: "David Chen", role: "Retail Operations", text: "The reporting features are second to none. It's the most polished inventory tool I've ever used." },
              { name: "Michael Ross", role: "Store Manager", text: "The mobile experience is incredible. I can check stock while I'm on the floor without missing a beat." }
            ].map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="p-8 rounded-3xl bg-secondary/30 border border-border relative">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-lg italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{t.name[0]}</div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <AnimatedSection className="max-w-4xl mx-auto rounded-[3rem] bg-foreground text-background p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">Ready to transform your business?</h2>
            <p className="text-background/70 text-lg mb-10 max-w-xl mx-auto font-body">Join over 2,500+ managers who trust StoreHub for their daily operations.</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="rounded-full px-10 h-16 text-lg font-bold">Start Your Free Trial</Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">SH</div>
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
