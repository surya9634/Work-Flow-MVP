"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, ShieldOff, Globe } from "lucide-react";

const items = [
    {
        icon: ShieldCheck,
        title: "TCPA-Aware Logic",
        description: "Automatic time-zone detection and calling-window enforcement.",
    },
    {
        icon: ShieldOff,
        title: "Opt-Out Handling",
        description: "Real-time DNC list management and instant suppression.",
    },
    {
        icon: Globe,
        title: "GDPR-Ready Infrastructure",
        description: "Data residency controls, consent tracking, and audit logs.",
    },
];

export function TrustSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <section ref={ref} className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center mb-12"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                    Built for Compliance
                </h2>
                <p className="text-zinc-600 text-sm max-w-md mx-auto">
                    Enterprise-grade safeguards so you can scale with confidence.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
                {items.map((item, i) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                        transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                        className="flex flex-col items-center text-center space-y-3"
                    >
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-zinc-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-300">{item.title}</h3>
                        <p className="text-zinc-600 text-xs leading-relaxed max-w-[220px]">
                            {item.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
