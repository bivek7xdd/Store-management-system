# Bold Typography Landing Page Redesign

## Summary
Transform `frontend/src/pages/LandingPage.tsx` from a glass-morphism/gradient-heavy design to the Bold Typography design system: sharp edges, massive type, vermillion accent (#FF3D00), text-only buttons with animated underlines, no shadows/gradients/rounded corners.

## Prerequisites (DONE)
- [x] Install font packages: `@fontsource/inter-tight`, `@fontsource/playfair-display`, `@fontsource/jetbrains-mono`

## CSS Variables Update
Update `frontend/src/index.css` — replace both `:root` and `.dark` blocks with:
```css
--background: 0 0% 4%;       /* #0A0A0A */
--foreground: 0 0% 98%;      /* #FAFAFA */
--muted: 0 0% 10%;           /* #1A1A1A */
--muted-foreground: 0 0% 45%;/* #737373 */
--accent: 16 100% 50%;       /* #FF3D00 */
--accent-foreground: 0 0% 4%;/* #0A0A0A */
--border: 0 0% 15%;          /* #262626 */
--input: 0 0% 10%;           /* #1A1A1A */
--card: 0 0% 6%;             /* #0F0F0F */
--ring: 16 100% 50%;         /* #FF3D00 */
--radius: 0px;
```

## LandingPage.tsx — Complete Rewrite

### Imports
```tsx
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Plus, Minus, Package, TrendingUp, Users,
  BarChart3, Shield, Smartphone, Zap, Twitter, Linkedin, Github, Check,
} from "lucide-react";
import { Link } from "react-router-dom";
// Font imports
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
```

### Design Tokens (inline in code)
- Background: `#0A0A0A`
- Foreground: `#FAFAFA`
- Muted surface: `#1A1A1A`
- Muted text: `#737373`
- Accent: `#FF3D00`
- Border: `#262626`
- Card: `#0F0F0F`

### Noise SVG (inline data URL)
```tsx
const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`;
```

### Animation Config
```tsx
const prefersReducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

const fadeInUp = {
  initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15, margin: "-50px" },
  transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.25, 0, 0, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
```

### Components to Implement

#### 1. PrimaryButton
- Text-only with animated underline
- `text-accent`, `uppercase`, `tracking-wider`
- Underline: `absolute h-0.5 bg-accent`, `scale-x-100` → `scale-x-110` on hover
- `active:translate-y-px` for press feedback
- ArrowRight icon (16px, stroke-1.5) that translates right on hover

#### 2. OutlineButton
- `border border-foreground`, `px-6 py-3`
- `uppercase tracking-wider text-sm font-semibold`
- Hover: `bg-foreground text-background`

#### 3. GhostButton
- No border, `text-muted-foreground`
- Hover: `text-foreground`
- Thin underline appears via `scale-x-0` → `scale-x-100`

#### 4. Navbar
- Fixed, top-0, full-width, `px-6 md:px-12 lg:px-16 py-6`
- No glass morphism, no rounded pill, no backdrop-blur
- Logo: text-only "StoreHub" with `tracking-tighter`
- Nav links: `text-muted-foreground` with underline on hover
- Sign In: muted text link
- Join Now: PrimaryButton (sm)

#### 5. DashboardPreview
- Remove ALL `rounded-*` classes
- Colors: bg `#0F0F0F`, border `#262626`, text `#FAFAFA`
- Sidebar: flat, no rounded items, active state uses `bg-[#1A1A1A]`
- Badge: `bg-accent text-[#0A0A0A]`, no rounded-full
- Cards: `bg-[#0F0F0F] border border-[#262626]`, no rounded-xl
- Stats labels: `font-mono uppercase tracking-wide`
- Table: flat borders, no rounded containers

#### 6. Hero Section
- Remove: video background, gradient orbs, blur effects, gradient text
- Remove: rounded badge pill with pulse dot
- Label: `font-mono text-xs uppercase tracking-widest text-[#737373]`
- Headline: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.0] tracking-tighter`
- Accent word: `text-accent` (no gradient, no italic underline animation)
- Subheadline: `text-[#737373] max-w-xl`
- CTA: PrimaryButton + OutlineButton side by side
- Decorative: large "01" number in `text-[#1A1A1A]` positioned top-right (hidden on mobile)
- Dashboard preview below with sharp edges

#### 7. Stats Section
- `border-t border-[#262626]`, `py-20 md:py-28`
- Grid: 2 cols mobile → 4 cols desktop
- Values: `text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter`
- Labels: `font-mono text-sm uppercase tracking-wider text-[#737373]`

#### 8. Features Section
- Remove: sticky card stack, gradient backgrounds, rounded cards, per-card glow
- Section label: `font-mono text-xs uppercase tracking-widest text-accent`
- Heading: `text-3xl md:text-5xl lg:text-6xl tracking-tighter`
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626]`
- Each card: `bg-[#0A0A0A] p-6 md:p-8`, hover `bg-[#0F0F0F]`
- Icon: `stroke-[1.5]`, `text-[#737373]` → `text-accent` on hover
- Title hover: `text-accent`

#### 9. How It Works Section
- `bg-[#0F0F0F] border-t border-[#262626]`
- 3-column grid on desktop
- Step number: `font-mono text-5xl md:text-6xl text-[#1A1A1A]`
- Horizontal rule after number: `h-px bg-[#262626]` → `bg-accent` on hover
- No movement on hover, pure color change

#### 10. Testimonials Section
- Remove: star ratings, gradient avatars, rounded cards, decorative quote marks
- Grid: same gap-px bg-[#262626] pattern
- Quote: `font-['Playfair_Display'] italic text-lg md:text-xl`
- Author: `font-['Inter_Tight'] font-semibold`
- Role: `font-mono text-xs uppercase tracking-wider text-[#737373]`
- Divider: `border-t border-[#262626]`

#### 11. FAQ Section
- `bg-[#0F0F0F] border-t border-[#262626]`
- Each item: `border-b border-[#262626]`
- Question: `text-lg md:text-xl tracking-tight`, hover `text-accent`
- Toggle: Plus/Minus icons from lucide, `stroke-[1.5]`
- Answer: `text-[#737373]`, height auto-animate 200ms

#### 12. Final CTA Section
- Remove: rounded-[4rem] container, gradient overlay, blur orbs, shadow
- No inverted background — keep dark theme consistent
- Headline: `text-4xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tighter`
- CTA: PrimaryButton + GhostButton

#### 13. Footer
- Remove: rounded logo badge
- Grid: 2 cols → 4 cols (md) → 5 cols (lg)
- Section headers: `font-mono text-xs uppercase tracking-widest text-[#737373]`
- Links: `text-sm text-[#737373] hover:text-foreground`
- Social icons: Twitter, Linkedin, Github, `w-[18px] h-[18px] stroke-[1.5]`
- Bottom bar: `border-t border-[#262626]`, copyright + tagline in mono

## Key Changes Summary
| Aspect | Before | After |
|--------|--------|-------|
| Border radius | rounded-full, rounded-xl, rounded-[2.5rem] | 0px everywhere |
| Colors | Teal/cyan primary, gradient orbs | #0A0A0A bg, #FF3D00 accent, no gradients |
| Buttons | Filled rounded buttons with shadows | Text + animated underline, sharp outline |
| Shadows | shadow-2xl, shadow-lg, blur effects | None |
| Typography | Inter, gradient text, italic accents | Inter Tight, solid colors, Playfair for quotes |
| Cards | Glass morphism, rounded, glow effects | Flat borders, gap-px grid, hover bg change |
| Hero | Video bg, gradient orbs, badge pill | Clean type, decorative numbers, minimal |
| Features | Sticky stacked cards | Grid with border separators |
| Animations | scale, bounce, glow | underline scale, color transitions, fade-up |
| Spacing | py-32 sections | py-28 md:py-40 |

## Verification
After implementing:
1. `cd frontend && npm run build` — ensure no build errors
2. Check responsive at 320px, 768px, 1024px, 1440px
3. Verify all interactive elements have focus states (ring-accent)
4. Confirm no `rounded-*`, `shadow-*`, `backdrop-blur-*` remain
5. Check contrast ratios (accent on bg = 5.4:1 AA)
