"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, Upload, Rocket } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: Bot,
        title: "Configure Your Agent",
        description: "Define persona, script, and objection handling in minutes.",
    },
    {
        number: "02",
        icon: Upload,
        title: "Upload Your Leads",
        description: "Import CSV or connect your CRM in seconds.",
    },
    {
        number: "03",
        icon: Rocket,
        title: "Launch & Book",
        description: "AI calls leads and books meetings on your calendar.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.55, ease: "easeOut" as const },
    }),
};

export function HowItWorksSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.25 });

    return (
        <section ref={ref} className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-widest uppercase">
                    How It Works
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    Three steps to autonomous outreach
                </h2>
                <p className="max-w-xl mx-auto text-zinc-500 text-base">
                    From setup to booked meetings in under five minutes.
                </p>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {steps.map((step, i) => (
                    <motion.div
                        key={step.number}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        className="group relative p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 transition-all duration-300 hover-lift overflow-hidden"
                    >
                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Step number */}
                        <span className="text-[10px] font-mono text-purple-500/60 tracking-widest uppercase mb-4 block relative z-10">
                            Step {step.number}
                        </span>

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-black border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-purple-500/30 transition-colors relative z-10">
                            <step.icon className="w-6 h-6 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                            {step.title}
                        </h3>
                        <p className="text-zinc-500 leading-relaxed relative z-10">
                            {step.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
