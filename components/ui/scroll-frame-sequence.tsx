"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

interface ScrollFrameSequenceProps {
    frameCount: number;
    framePath: (index: number) => string;
    className?: string;
}

export function ScrollFrameSequence({
    frameCount,
    framePath,
    className,
}: ScrollFrameSequenceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [loaded, setLoaded] = useState(false);
    const currentFrameRef = useRef(0);

    // Find the scrollable ancestor (the ContainerScroll wrapper)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // Preload all frames
    useEffect(() => {
        let isMounted = true;
        const images: HTMLImageElement[] = [];
        let loadedCount = 0;

        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = framePath(i);
            img.onload = () => {
                loadedCount++;
                if (loadedCount === frameCount && isMounted) {
                    setLoaded(true);
                    // Draw first frame
                    drawFrame(0, images);
                }
            };
            images.push(img);
        }

        imagesRef.current = images;

        return () => {
            isMounted = false;
        };
    }, [frameCount, framePath]);

    const drawFrame = useCallback(
        (index: number, images?: HTMLImageElement[]) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const imgs = images || imagesRef.current;
            const img = imgs[index];
            if (!img || !img.complete) return;

            // Set canvas size to match image
            if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        },
        []
    );

    // Listen to scroll progress and update frame
    useMotionValueEvent(scrollYProgress, "change", (progress) => {
        if (!loaded) return;

        // Map progress (0-1) to frame index (0 to frameCount-1)
        const frameIndex = Math.min(
            Math.floor(progress * frameCount),
            frameCount - 1
        );

        if (frameIndex !== currentFrameRef.current && frameIndex >= 0) {
            currentFrameRef.current = frameIndex;
            drawFrame(frameIndex);
        }
    });

    return (
        <div ref={containerRef} className={className}>
            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
                style={{ display: loaded ? "block" : "none" }}
            />
            {!loaded && (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
