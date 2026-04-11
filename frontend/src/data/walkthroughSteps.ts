import { Step } from "react-joyride";

export interface WalkthroughStep extends Step {
    /** The route the user must be on for this step to render */
    page?: string;
}

export const walkthroughSteps: WalkthroughStep[] = [
    // ── Welcome ───────────────────────────────────────────────────────
    {
        target: "body",
        placement: "center",
        title: "Welcome to StoreHub",
        content:
            "Let us show you around! This quick tour will walk you through the core features of StoreHub.",
        disableBeacon: true,
        page: "/",
    },

    // ── Dashboard ─────────────────────────────────────────────────────
    {
        target: '[data-tour="dashboard-cards"]',
        placement: "bottom",
        title: "Dashboard Overview",
        content:
            "These cards show today's sales, outstanding debts, low stock, and expiring products at a glance.",
        disableBeacon: true,
        page: "/",
    },
    {
        target: '[data-tour="quick-actions"]',
        placement: "bottom",
        title: "Quick Actions",
        content:
            "Jump straight into common tasks like creating a sale, adding products, or generating reports.",
        disableBeacon: true,
        page: "/",
    },

    // ── Inventory ─────────────────────────────────────────────────────
    {
        target: '[data-tour="inventory-header"]',
        placement: "bottom",
        title: "Inventory Management",
        content:
            "Add, edit, and manage all your products here. You can also import and export inventory data via CSV.",
        disableBeacon: true,
        page: "/inventory",
    },
    {
        target: '[data-tour="inventory-scanner"]',
        placement: "bottom",
        title: "Barcode Scanner",
        content:
            "Use your camera to scan barcodes and find products instantly. Works for both searching and adding new items.",
        disableBeacon: true,
        page: "/inventory",
    },
    {
        target: '[data-tour="inventory-filters"]',
        placement: "bottom",
        title: "Search and Filter",
        content:
            "Search by product name or barcode. Filter by category or stock status to find items quickly.",
        disableBeacon: true,
        page: "/inventory",
    },

    // ── Sales / POS ───────────────────────────────────────────────────
    {
        target: '[data-tour="sales-header"]',
        placement: "bottom",
        title: "Point of Sale",
        content:
            "Your POS system. Search or scan products, add them to cart, and process payments. Works offline too.",
        disableBeacon: true,
        page: "/sales",
    },
    {
        target: '[data-tour="sales-cart"]',
        placement: "left",
        title: "Cart and Checkout",
        content:
            "Review items, adjust quantities, apply discounts, and complete the sale. Partial payments automatically create debt records.",
        disableBeacon: true,
        page: "/sales",
    },

    // ── Debtors ───────────────────────────────────────────────────────
    {
        target: '[data-tour="debtors-summary"]',
        placement: "bottom",
        title: "Debtor Management",
        content:
            "Track total outstanding amounts, manage debtors, send SMS reminders, and mark debts as paid.",
        disableBeacon: true,
        page: "/debtors",
    },

    // ── Reports ───────────────────────────────────────────────────────
    {
        target: '[data-tour="reports-header"]',
        placement: "bottom",
        title: "Intelligence Hub",
        content:
            "Your business nerve center. View sales trends, inventory breakdowns, and advanced analytics.",
        disableBeacon: true,
        page: "/reports",
    },
    {
        target: '[data-tour="reports-kpis"]',
        placement: "bottom",
        title: "Key Performance Indicators",
        content:
            "Track your Total Sales, Gross Profit, Inventory Value, and Receivables in real-time.",
        disableBeacon: true,
        page: "/reports",
    },
    {
        target: '[data-tour="reports-export"]',
        placement: "left",
        title: "Export Data",
        content:
            "Generate professional PDF reports or CSV exports for your accounting and tax needs.",
        disableBeacon: true,
        page: "/reports",
    },

    // ── Market ────────────────────────────────────────────────────────
    {
        target: '[data-tour="market-header"]',
        placement: "bottom",
        title: "Market Insights",
        content:
            "Stay ahead with competitor analysis and market trends. We track local competitors and online prices for you.",
        disableBeacon: true,
        page: "/market",
    },
    {
        target: '[data-tour="market-prices"]',
        placement: "bottom",
        title: "Price Tracking",
        content:
            "Compare your store prices with major online retailers like Daraz and Hamrobazar in real-time.",
        disableBeacon: true,
        page: "/market",
    },
    {
        target: '[data-tour="market-discovery-search"]',
        placement: "bottom",
        title: "Supplier Discovery",
        content:
            "Find wholesale suppliers and distributors for any product near your location using our interactive map.",
        disableBeacon: true,
        page: "/market/discovery",
    },
    {
        target: '[data-tour="market-discovery-map"]',
        placement: "top",
        title: "Interactive Map",
        content:
            "Visualize supplier locations, see their distance from your store, and get driving directions instantly.",
        disableBeacon: true,
        page: "/market/discovery",
    },

    // ── Finish ────────────────────────────────────────────────────────
    {
        target: '[data-tour="start-tour-btn"]',
        placement: "top",
        title: "Replay This Tour",
        content:
            "Click this button anytime to restart the tour. You're all set to manage your store!",
        disableBeacon: true,
        page: "/",
    },
];
