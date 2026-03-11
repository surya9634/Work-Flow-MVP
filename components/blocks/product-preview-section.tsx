"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, MessageSquare, CalendarCheck } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: "easeOut" as const },
    },
};

export function ProductPreviewSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section ref={ref} className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-widest uppercase">
                    Product
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    See it in action
                </h2>
                <p className="max-w-xl mx-auto text-zinc-500 text-base">
                    A unified command center for building, calling, and booking.
                </p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="grid md:grid-cols-3 gap-6"
            >
                {/* Frame 1: Agent Builder */}
                <motion.div variants={itemVariants} className="group rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover-lift">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">Agent Builder</span>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Mock fields */}
                        <div className="space-y-1.5">
                            <div className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Agent Name</div>
                            <div className="h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-3 flex items-center">
                                <span className="text-sm text-zinc-400">Sales Rep — Enterprise</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Greeting</div>
                            <div className="h-16 rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-3 pt-2">
                                <span className="text-sm text-zinc-500 leading-relaxed">Hi, this is Sarah from Work-Flow. I&apos;m reaching out because...</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Goal</div>
                            <div className="h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-3 flex items-center">
                                <span className="text-sm text-zinc-400">Book a 15-min demo call</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Frame 2: Live Call Transcript */}
                <motion.div variants={itemVariants} className="group rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover-lift">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Live Transcript</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                        </span>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex gap-3">
                            <span className="text-[10px] font-mono text-purple-400 mt-0.5 shrink-0 w-8">AI</span>
                            <p className="text-sm text-zinc-300 leading-relaxed">Hi, this is Sarah from Work-Flow. I noticed your team is scaling outbound...</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-[10px] font-mono text-zinc-500 mt-0.5 shrink-0 w-8">Lead</span>
                            <p className="text-sm text-zinc-400 leading-relaxed">Yeah, we&apos;ve been looking at automation tools. What makes you different?</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-[10px] font-mono text-purple-400 mt-0.5 shrink-0 w-8">AI</span>
                            <p className="text-sm text-zinc-300 leading-relaxed">Great question. Our AI handles the entire conversation and books directly...</p>
                        </div>
                        <div className="h-4 w-20 rounded bg-zinc-800/60 animate-pulse" />
                    </div>
                </motion.div>

                {/* Frame 3: Booking Confirmed */}
                <motion.div variants={itemVariants} className="group rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover-lift">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center">
                            <CalendarCheck className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">Booking Confirmed</span>
                    </div>
                    <div className="p-5 flex flex-col items-center justify-center text-center space-y-5 min-h-[220px]">
                        {/* Success indicator */}
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-white font-semibold text-base">Meeting Booked</p>
                            <p className="text-zinc-500 text-sm">Demo Call — 15 min</p>
                        </div>
                        <div className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Date</span>
                                <span className="text-zinc-300">Feb 24, 2026</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Time</span>
                                <span className="text-zinc-300">2:30 PM EST</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">With</span>
                                <span className="text-zinc-300">J. Rodriguez</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
