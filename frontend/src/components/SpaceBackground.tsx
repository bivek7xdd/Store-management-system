import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Store, ShoppingCart, Package, BarChart3, TrendingUp, DollarSign } from "lucide-react";

interface SpaceBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ children, className = "flex items-center justify-center" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const starsRef = useRef<HTMLDivElement>(null);
    const iconsRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !starsRef.current || !iconsRef.current) return;

        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();

        // Create Stars
        const starCount = 100;
        const stars: HTMLDivElement[] = [];

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement("div");
            star.classList.add("absolute", "bg-white", "rounded-full");

            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.opacity = `${Math.random()}`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;

            starsRef.current.appendChild(star);
            stars.push(star);

            // Animate Stars (Falling effect)
            gsap.to(star, {
                y: height,
                duration: Math.random() * 5 + 2,
                repeat: -1,
                ease: "linear",
                delay: Math.random() * 5,
            });
        }

        // Floating Icons Logic
        const iconElements = Array.from(iconsRef.current.children) as HTMLElement[];
        iconElements.forEach((icon) => {
            // Random initial position
            gsap.set(icon, {
                x: Math.random() * width,
                y: Math.random() * height,
                rotation: Math.random() * 360,
                scale: Math.random() * 0.5 + 0.5,
            });

            // Floating animation
            gsap.to(icon, {
                x: `+=${Math.random() * 200 - 100}`,
                y: `+=${Math.random() * 200 - 100}`,
                rotation: `+=${Math.random() * 180 - 90}`,
                duration: Math.random() * 10 + 10,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Falling/Drifting effect separately
            gsap.to(icon, {
                y: `+=${height}`,
                duration: Math.random() * 20 + 20,
                repeat: -1,
                ease: "linear",
                modifiers: {
                    y: (y) => {
                        const val = parseFloat(y as string);
                        return `${val % (height + 100) - 100}px`; // Wrap around
                    }
                }
            });
        });

        // Mouse Move Effect (Cursor Glow)
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                gsap.to(cursorRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.1,
                    ease: "power2.out"
                });
            }
        };

        // Click Ripple Effect
        const handleClick = (e: MouseEvent) => {
            const ripple = document.createElement("div");
            ripple.classList.add("absolute", "border", "border-teal-500/50", "rounded-full", "pointer-events-none");
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            ripple.style.transform = "translate(-50%, -50%)";
            container.appendChild(ripple);

            gsap.fromTo(ripple,
                { width: 0, height: 0, opacity: 1 },
                {
                    width: 500,
                    height: 500,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out",
                    onComplete: () => ripple.remove()
                }
            );
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("click", handleClick);

        return () => {
            // Cleanup gsap animations
            gsap.killTweensOf(stars);
            gsap.killTweensOf(iconElements);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("click", handleClick);
            if (starsRef.current) starsRef.current.innerHTML = "";
        };
    }, []);

    // Icon set for background
    const Icons = [Store, ShoppingCart, Package, BarChart3, TrendingUp, DollarSign];

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white"
            style={{
                background: "radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)"
            }}
        >
            {/* Cursor Glow */}
            <div
                ref={cursorRef}
                className="fixed w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0"
                style={{ transform: "translate(-50%, -50%)" }}
            />

            {/* Stars Container */}
            <div ref={starsRef} className="absolute inset-0 z-0 pointer-events-none" />

            {/* Floating Icons Container */}
            <div ref={iconsRef} className="absolute inset-0 z-0 pointer-events-none opacity-20">
                {Icons.map((Icon, index) => (
                    <div key={index} className="absolute text-teal-500/30">
                        <Icon size={48} />
                    </div>
                ))}
                {/* Add more icons for density */}
                {Icons.map((Icon, index) => (
                    <div key={`dup-${index}`} className="absolute text-blue-500/20">
                        <Icon size={64} />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className={`relative z-10 w-full h-full min-h-screen ${className}`}>
                {children}
            </div>
        </div>
    );
};

export default SpaceBackground;
