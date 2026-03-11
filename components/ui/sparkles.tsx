"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

type ParticlesProps = {
    id?: string;
    className?: string;
    background?: string;
    particleSize?: number;
    minSize?: number;
    maxSize?: number;
    speed?: number;
    particleColor?: string;
    particleDensity?: number;
};

interface Particle {
    x: number;
    y: number;
    size: number;
    opacity: number;
    opacityDir: number;
    speed: number;
    vx: number;
    vy: number;
}

export const SparklesCore = ({
    className,
    background = "transparent",
    minSize = 0.4,
    maxSize = 1,
    speed = 4,
    particleColor = "#FFFFFF",
    particleDensity = 120,
}: ParticlesProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);

    const hexToRgb = useCallback((hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : { r: 255, g: 255, b: 255 };
    }, []);

    const initParticles = useCallback(
        (width: number, height: number) => {
            const area = (width * height) / (400 * 400);
            const count = Math.floor(particleDensity * area);
            const particles: Particle[] = [];

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: minSize + Math.random() * (maxSize - minSize),
                    opacity: Math.random(),
                    opacityDir: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * speed) * 0.01,
                    speed: 0.05 + Math.random() * 0.15,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                });
            }

            particlesRef.current = particles;
        },
        [minSize, maxSize, speed, particleDensity]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            initParticles(rect.width, rect.height);
        };

        resize();
        window.addEventListener("resize", resize);

        const rgb = hexToRgb(particleColor);

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            ctx.clearRect(0, 0, w, h);

            if (background !== "transparent") {
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, w, h);
            }

            for (const p of particlesRef.current) {
                // Update opacity
                p.opacity += p.opacityDir;
                if (p.opacity >= 1) {
                    p.opacity = 1;
                    p.opacityDir = -Math.abs(p.opacityDir);
                } else if (p.opacity <= 0.05) {
                    p.opacity = 0.05;
                    p.opacityDir = Math.abs(p.opacityDir);
                }

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;
                if (p.y < -5) p.y = h + 5;
                if (p.y > h + 5) p.y = -5;

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
                ctx.fill();
            }

            animRef.current = requestAnimationFrame(animate);
        };

        // Small delay so fade-in is visible
        const timer = setTimeout(() => {
            animate();
        }, 100);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animRef.current);
            clearTimeout(timer);
        };
    }, [background, particleColor, hexToRgb, initParticles]);

    return (
        <div className={cn("relative w-full h-full", className)}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
};
