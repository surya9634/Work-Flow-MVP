"use client";
import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import Link from "next/link";

export function SparklesSection() {
    return (
        <section className="relative z-10 w-full bg-black">
            {/* Top fade for seamless blend */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10" />

            <div className="w-full flex flex-col items-center justify-center overflow-hidden py-20">
                {/* Headline */}
                <div className="flex flex-col items-center justify-center gap-2 relative z-20 px-6">
                    <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-4">
                        Always On
                    </p>
                    <h2 className="md:text-7xl text-4xl lg:text-8xl font-bold text-center text-white tracking-tight">
                        Your AI Sales Agent
                    </h2>
                    <h2 className="md:text-7xl text-4xl lg:text-8xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 tracking-tight">
                        Never Sleeps
                    </h2>
                </div>

                {/* Sparkles + gradient line container */}
                <div className="w-full max-w-4xl h-32 relative mt-2">
                    {/* Gradient glow lines */}
                    <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-[2px] w-3/4 blur-sm" />
                    <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px w-3/4" />
                    <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-pink-500 to-transparent h-[5px] w-1/4 blur-sm" />
                    <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-pink-500 to-transparent h-px w-1/4" />

                    {/* Sparkles effect */}
                    <SparklesCore
                        background="transparent"
                        minSize={0.4}
                        maxSize={1.4}
                        particleDensity={800}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                        speed={3}
                    />

                    {/* Radial mask to prevent sharp edges */}
                    <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
                </div>

                {/* Subtitle + CTAs */}
                <div className="relative z-20 flex flex-col items-center gap-6 mt-4">
                    <p className="text-zinc-500 text-center max-w-md text-sm leading-relaxed">
                        AI agents that think, speak, and close deals — so your team can focus on what matters.
                    </p>

                    {/* Primary CTA */}
                    <Link
                        href="/signup"
                        className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-300 animate-glow-pulse"
                    >
                        Deploy Your AI Agent
                        <span className="group-hover:translate-x-1 transition-transform duration-200">&#8594;</span>
                    </Link>

                    {/* Secondary CTA */}
                    <button className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500">
                        Watch 2-min Demo
                    </button>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10" />
        </section>
    );
}
