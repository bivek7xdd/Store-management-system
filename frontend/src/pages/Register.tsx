import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Store, User, MapPin, Check, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Phone, Lock, Building2, DollarSign, BarChart3, Shield, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface FormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    store_name: string;
    store_address: string;
    currency_code: string;
}

const STEPS = [
    { id: 1, title: "Account", description: "Personal details", icon: User },
    { id: 2, title: "Store", description: "Business info", icon: Store },
    { id: 3, title: "Review", description: "Confirm", icon: Check },
];

const CURRENCIES = [
    { code: "NPR", name: "Nepalese Rupee", symbol: "रू" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

const colors = {
    primary: "#0d9488",
    primaryDark: "#115e59",
    primaryLight: "#14b8a6",
    accent: "#134e4a",
    success: "#059669",
    successDark: "#047857",
};

const Register = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        store_name: "",
        store_address: "",
        currency_code: "NPR",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Form Entry Animation
        gsap.fromTo(containerRef.current,
            { opacity: 0, x: 50 },
            { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
        );

        // Left Panel Animations
        if (imageRef.current) {
            gsap.to(imageRef.current, {
                scale: 1.1,
                duration: 20,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        if (contentRef.current) {
            gsap.from(contentRef.current.children, {
                y: 20,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                delay: 0.5,
                ease: "power2.out"
            });
        }

        // Rising Particles Animation
        if (particlesRef.current) {
            const particles = Array.from(particlesRef.current.children);

            particles.forEach((particle) => {
                gsap.to(particle, {
                    y: `-${window.innerHeight + 100}`, // Move up off screen
                    duration: "random(10, 20)",
                    repeat: -1,
                    ease: "none",
                    delay: "random(0, 10)",
                });
            });
        }
    }, [currentStep]); // Re-run subtle effects on step change if needed, but mostly entry is once

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!particlesRef.current) return;

        // Simple Parallax
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        gsap.to(particlesRef.current, {
            x: (mouseX - 0.5) * 20,
            y: (mouseY - 0.5) * 20,
            duration: 1,
            ease: "power2.out"
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (step === 1) {
            if (!formData.name.trim()) newErrors.name = "Full name is required";
            if (!formData.email.trim()) {
                newErrors.email = "Email is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = "Please enter a valid email";
            }
            if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
            if (!formData.password) {
                newErrors.password = "Password is required";
            } else if (formData.password.length < 8) {
                newErrors.password = "Min 8 characters";
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Confirm password";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords don't match";
            }
        }

        if (step === 2) {
            if (!formData.store_name.trim()) newErrors.store_name = "Store name is required";
            if (!formData.store_address.trim()) newErrors.store_address = "Store address is required";
            if (!formData.currency_code) newErrors.currency_code = "Please select a currency";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            // Animate exit current step
            const container = document.querySelector(".step-container");
            if (container) {
                gsap.to(container, {
                    x: -20,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => setCurrentStep(prev => Math.min(prev + 1, 3))
                });
            } else {
                setCurrentStep(prev => Math.min(prev + 1, 3));
            }
        }
    };

    const prevStep = () => {
        const container = document.querySelector(".step-container");
        if (container) {
            gsap.to(container, {
                x: 20,
                opacity: 0,
                duration: 0.3,
                onComplete: () => setCurrentStep(prev => Math.max(prev - 1, 1))
            });
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 1))
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(1) || !validateStep(2)) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log("Registration data:", {
            owner: { name: formData.name, email: formData.email, phone: formData.phone, password: formData.password },
            store: { name: formData.store_name, address: formData.store_address, currency_code: formData.currency_code }
        });

        setIsSubmitting(false);
        navigate("/otp", { state: { email: formData.email } });
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
                                style={{
                                    background: isCompleted
                                        ? `linear-gradient(135deg, ${colors.success}, ${colors.successDark})`
                                        : isActive
                                            ? `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`
                                            : "rgba(13, 148, 136, 0.1)",
                                    boxShadow: isActive ? `0 8px 25px -5px ${colors.primary}60` : "none"
                                }}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <StepIcon className="w-5 h-5" style={{ color: isActive ? "white" : colors.primary }} />
                                )}
                                {isActive && (
                                    <span
                                        className="absolute -inset-1.5 rounded-full animate-pulse"
                                        style={{ border: `2px solid ${colors.primary}40` }}
                                    />
                                )}
                            </div>
                            <span
                                className="mt-2 text-xs font-semibold transition-colors"
                                style={{ color: isActive ? colors.primaryDark : isCompleted ? colors.success : "#9ca3af" }}
                            >
                                {step.title}
                            </span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div
                                className="flex-1 h-0.5 mx-3 rounded-full transition-all duration-500"
                                style={{
                                    background: currentStep > step.id
                                        ? `linear-gradient(90deg, ${colors.success}, ${colors.successDark})`
                                        : `${colors.primary}20`
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );

    const inputClassName = (hasError: boolean) => `
        h-12 rounded-xl bg-white/80 focus:bg-white transition-all duration-200
        ${hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}
    `;

    // Wrapped in step-container for animation targeting
    const renderStep1 = () => (
        <div className="step-container space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: colors.primary }} />
                    Full Name
                </Label>
                <Input
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={inputClassName(!!errors.name)}
                    style={{ borderColor: errors.name ? undefined : `${colors.primary}30` }}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: colors.primary }} />
                    Email Address
                </Label>
                <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClassName(!!errors.email)}
                    style={{ borderColor: errors.email ? undefined : `${colors.primary}30` }}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: colors.primary }} />
                    Phone Number
                </Label>
                <Input
                    name="phone"
                    type="tel"
                    placeholder="+977 98XXXXXXXX"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClassName(!!errors.phone)}
                    style={{ borderColor: errors.phone ? undefined : `${colors.primary}30` }}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" style={{ color: colors.primary }} />
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`${inputClassName(!!errors.password)} pr-10`}
                            style={{ borderColor: errors.password ? undefined : `${colors.primary}30` }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" style={{ color: colors.primary }} />
                        Confirm
                    </Label>
                    <div className="relative">
                        <Input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`${inputClassName(!!errors.confirmPassword)} pr-10`}
                            style={{ borderColor: errors.confirmPassword ? undefined : `${colors.primary}30` }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-container space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: colors.primary }} />
                    Store Name
                </Label>
                <Input
                    name="store_name"
                    placeholder="Your awesome store name"
                    value={formData.store_name}
                    onChange={handleInputChange}
                    className={inputClassName(!!errors.store_name)}
                    style={{ borderColor: errors.store_name ? undefined : `${colors.primary}30` }}
                />
                {errors.store_name && <p className="text-xs text-red-500">{errors.store_name}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: colors.primary }} />
                    Store Address
                </Label>
                <Input
                    name="store_address"
                    placeholder="Street address, City, Country"
                    value={formData.store_address}
                    onChange={handleInputChange}
                    className={inputClassName(!!errors.store_address)}
                    style={{ borderColor: errors.store_address ? undefined : `${colors.primary}30` }}
                />
                {errors.store_address && <p className="text-xs text-red-500">{errors.store_address}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: colors.primary }} />
                    Currency
                </Label>
                <Select value={formData.currency_code} onValueChange={(v) => handleSelectChange("currency_code", v)}>
                    <SelectTrigger
                        className="h-12 rounded-xl bg-white/80"
                        style={{ borderColor: `${colors.primary}30` }}
                    >
                        <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                        {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                <span className="flex items-center gap-2">
                                    <span className="font-medium">{c.symbol}</span>
                                    <span>{c.name}</span>
                                    <span className="text-gray-400">({c.code})</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div
                className="p-4 rounded-xl border border-dashed flex items-start gap-3"
                style={{ background: `${colors.primary}08`, borderColor: `${colors.primary}30` }}
            >
                <span className="text-xl">💡</span>
                <p className="text-sm text-gray-600">
                    <span className="font-semibold" style={{ color: colors.primaryDark }}>Pro tip:</span> You can update your store details anytime from settings.
                </p>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const currency = CURRENCIES.find(c => c.code === formData.currency_code);

        return (
            <div className="step-container space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
                        style={{ background: `linear-gradient(135deg, ${colors.success}20, ${colors.successDark}20)` }}
                    >
                        <Check className="w-7 h-7" style={{ color: colors.success }} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Almost there!</h3>
                    <p className="text-sm text-gray-500">Review your information</p>
                </div>

                {/* Account Info Card */}
                <div
                    className="rounded-2xl p-4 border"
                    style={{ background: "rgba(255, 255, 255, 0.8)", borderColor: `${colors.primary}15` }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4" style={{ color: colors.primary }} />
                        <span className="text-sm font-bold" style={{ color: colors.primaryDark }}>Account</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{formData.name}</span></div>
                        <div className="h-px" style={{ background: `${colors.primary}10` }} />
                        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{formData.email}</span></div>
                        <div className="h-px" style={{ background: `${colors.primary}10` }} />
                        <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{formData.phone}</span></div>
                    </div>
                </div>

                {/* Store Info Card */}
                <div
                    className="rounded-2xl p-4 border"
                    style={{ background: "rgba(255, 255, 255, 0.8)", borderColor: `${colors.primary}15` }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Store className="w-4 h-4" style={{ color: colors.primary }} />
                        <span className="text-sm font-bold" style={{ color: colors.primaryDark }}>Store</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{formData.store_name}</span></div>
                        <div className="h-px" style={{ background: `${colors.primary}10` }} />
                        <div className="flex justify-between items-start">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-right max-w-[55%]">{formData.store_address}</span>
                        </div>
                        <div className="h-px" style={{ background: `${colors.primary}10` }} />
                        <div className="flex justify-between">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-medium">{currency?.symbol} {currency?.code}</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-center text-gray-500 px-4">
                    By clicking Create Account, you agree to our{" "}
                    <Link to="/terms" className="font-medium hover:underline" style={{ color: colors.primary }}>Terms</Link> and{" "}
                    <Link to="/privacy" className="font-medium hover:underline" style={{ color: colors.primary }}>Privacy Policy</Link>.
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* Left Panel - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
                {/* Background Image */}
                <img
                    ref={imageRef}
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
                <div ref={contentRef} className="relative z-10 flex flex-col justify-center px-16 text-white">
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
                        Start Your<br />
                        <span className="text-teal-200">Business Journey</span>
                    </h1>

                    <p className="text-lg text-white/80 max-w-md leading-relaxed mb-12">
                        Join thousands of store owners who trust StoreHub to manage their inventory and grow their business.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {[
                            { icon: Shield, text: "Bank-level Security" },
                            { icon: Zap, text: "Setup in 2 Minutes" },
                            { icon: BarChart3, text: "Real-time Analytics" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md"
                                    style={{ background: "rgba(255, 255, 255, 0.15)" }}
                                >
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div
                className="flex-1 flex items-center justify-center p-6 overflow-hidden relative"
                style={{ background: "linear-gradient(180deg, #fffcf5 0%, #fef9f0 50%, #fdf6e8 100%)" }}
                onMouseMove={handleMouseMove}
            >
                {/* Rising Particles Background */}
                <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-teal-500/10 blur-sm"
                            style={{
                                width: Math.random() * 20 + 10 + "px",
                                height: Math.random() * 20 + 10 + "px",
                                left: Math.random() * 100 + "%",
                                top: "110%", // Start below the screen
                            }}
                        />
                    ))}
                </div>

                <div className="w-full max-w-lg relative z-10" ref={containerRef}>
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})` }}>
                            <Store className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold" style={{ color: colors.primaryDark }}>StoreHub</span>
                    </div>

                    {/* Card */}
                    <div
                        className="rounded-3xl p-8 shadow-xl border"
                        style={{ background: "rgba(255, 255, 255, 0.95)", borderColor: `${colors.primary}10` }}
                    >
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: `${colors.primary}10` }}>
                                <Store className="w-4 h-4" style={{ color: colors.primary }} />
                                <span className="text-sm font-medium" style={{ color: colors.primaryDark }}>Create Account</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {currentStep === 1 && "Personal Details"}
                                {currentStep === 2 && "Store Information"}
                                {currentStep === 3 && "Review & Confirm"}
                            </h2>
                        </div>

                        {renderStepIndicator()}

                        <div className="min-h-[320px] relative">
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-8">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="flex-1 h-12 rounded-xl border-2 font-semibold hover:bg-gray-50"
                                    style={{ borderColor: `${colors.primary}40`, color: colors.primaryDark }}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            )}
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 h-12 rounded-xl text-base font-semibold shadow-lg transition-all hover:translate-y-[-1px] active:translate-y-0"
                                    style={{ background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`, boxShadow: `0 10px 40px -12px ${colors.primary}` }}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 h-12 rounded-xl text-base font-semibold shadow-lg transition-all hover:translate-y-[-1px] active:translate-y-0"
                                    style={{ background: `linear-gradient(135deg, ${colors.success}, ${colors.successDark})`, boxShadow: `0 10px 40px -12px ${colors.success}` }}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Create Account
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div className="text-center mt-6 pt-6 border-t border-gray-100">
                            <p className="text-gray-500">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold hover:underline" style={{ color: colors.primary }}>Sign in</Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-400 mt-6">© 2024 StoreHub. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Register;
