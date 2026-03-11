"use client";

import { Bot, Upload, Calendar } from "lucide-react";
import { HeroSection } from "@/components/blocks/hero-section-dark";
import { SparklesSection } from "@/components/blocks/sparkles-section";
import { HowItWorksSection } from "@/components/blocks/how-it-works-section";
import { ProductPreviewSection } from "@/components/blocks/product-preview-section";
import { TestimonialsSection } from "@/components/blocks/testimonials-section";
import { TrustSection } from "@/components/blocks/trust-section";
import { FloatingNav } from "@/components/ui/floating-navbar";

const navItems = [
    { name: "How It Works", link: "#how-it-works" },
    { name: "Product", link: "#product" },
    { name: "Testimonials", link: "#testimonials" },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
            <FloatingNav navItems={navItems} />

            {/* Background Grid Effect */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Hero */}
            <HeroSection
                title="AI Voice Agents for Sales"
                subtitle={{
                    regular: "Deploy autonomous agents that ",
                    gradient: "call, qualify, and book meetings.",
                }}
                description="Work-Flow builds AI-powered voice agents that handle your entire outbound pipeline — from cold calls to booked demos — while your team focuses on closing."
                ctaText="Start Building Free"
                ctaHref="/signup"
                microCopy="No credit card required · 5-minute setup"
                steps={[
                    { icon: <Bot className="w-4 h-4" />, label: "Build Agent" },
                    { icon: <Upload className="w-4 h-4" />, label: "Upload Leads" },
                    { icon: <Calendar className="w-4 h-4" />, label: "Book Meetings" },
                ]}
                gridOptions={{
                    angle: 65,
                    cellSize: 60,
                    opacity: 0.3,
                    darkLineColor: "#27272a",
                }}
            />

            {/* Sparkles CTA */}
            <SparklesSection />

            {/* How It Works */}
            <div id="how-it-works">
                <HowItWorksSection />
            </div>

            {/* Product Preview */}
            <div id="product">
                <ProductPreviewSection />
            </div>

            {/* Testimonials */}
            <div id="testimonials">
                <TestimonialsSection />
            </div>

            {/* Trust / Compliance */}
            <TrustSection />

            {/* Footer */}
            <footer className="relative z-10 border-t border-zinc-900 py-12 px-6 text-center">
                <p className="text-zinc-600 text-xs">
                    &copy; {new Date().getFullYear()} Work-Flow. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
