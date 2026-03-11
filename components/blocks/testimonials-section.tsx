"use client";

import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function TestimonialsSection() {
    return (
        <AnimatedTestimonials
            title="What our users say"
            subtitle="Teams across the globe are automating their outreach and closing more deals with Work-Flow's AI agents."
            badgeText="Trusted by teams"
            autoRotateInterval={5000}
            testimonials={[
                {
                    id: 1,
                    name: "Alex Johnson",
                    role: "Head of Sales",
                    company: "TechFlow",
                    content:
                        "Work-Flow's AI agents handle our entire outbound calling process. We've 3x'd our meeting bookings while our sales team focuses on closing deals instead of cold calling.",
                    rating: 5,
                    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                    highlight: "3x more meetings",
                },
                {
                    id: 2,
                    name: "Sarah Miller",
                    role: "Operations Lead",
                    company: "ScaleUp",
                    content:
                        "The auto-scheduling feature alone saved us 20 hours a week. The AI handles objections naturally and books qualified meetings directly into our calendar. Game changer.",
                    rating: 5,
                    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                    highlight: "20 hrs/week saved",
                },
                {
                    id: 3,
                    name: "Michael Chen",
                    role: "CEO",
                    company: "InnovateLabs",
                    content:
                        "We launched our outbound campaign in under 30 minutes. Uploaded leads, configured the agent persona, and watched meetings roll in. Replaced our entire SDR workload.",
                    rating: 5,
                    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
                    highlight: "Replaced SDR workload",
                },
            ]}
            trustedCompanies={["Vercel", "Linear", "Notion", "Stripe", "Resend"]}
            trustedCompaniesTitle="Trusted by fast-growing companies"
        />
    );
}
