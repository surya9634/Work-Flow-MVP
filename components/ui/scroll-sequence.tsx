"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

interface ScrollSequenceProps {
    imagePathPrefix: string;
    imagePathSuffix: string;
    frameCount: number;
    height?: string; // height of the scroll container
    width?: string;
    className?: string;
    digits?: number; // Number of digits for padding (default 3)
}

export function ScrollSequence({
    imagePathPrefix,
    imagePathSuffix,
    frameCount,
    height = "200vh",
    width = "100%",
    className,
    digits = 3,
}: ScrollSequenceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Track scroll progress relative to the container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Convert scroll progress (0-1) to frame index (0 to frameCount-1)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

    useEffect(() => {
        // Preload images
        const loadImages = async () => {
            const promises = [];
            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                const frameNumber = String(i).padStart(digits, '0');
                img.src = `${imagePathPrefix}${frameNumber}${imagePathSuffix}`;
                promises.push(
                    new Promise((resolve) => {
                        img.onload = () => resolve(img);
                        img.onerror = () => resolve(null); // Continue even if one fails
                    })
                );
            }

            const loadedImages = await Promise.all(promises);
            setImages(loadedImages.filter((img): img is HTMLImageElement => img !== null));
            setImagesLoaded(true);
        };

        loadImages();
    }, [frameCount, imagePathPrefix, imagePathSuffix, digits]);

    useEffect(() => {
        if (!imagesLoaded || images.length === 0) return;

        const render = (index: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;

            const img = images[Math.round(index)];
            if (img) {
                // Maintain aspect ratio cover
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.max(hRatio, vRatio);
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    centerShift_x,
                    centerShift_y,
                    img.width * ratio,
                    img.height * ratio
                );
            }
        };

        // Render initial frame
        render(0);

        // Subscribe to scroll changes
        const unsubscribe = frameIndex.onChange((latest) => {
            requestAnimationFrame(() => render(latest));
        });

        return () => unsubscribe();
    }, [imagesLoaded, images, frameIndex]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                // Re-render current frame on resize
                const currentIndex = frameIndex.get();
                // Manually trigger render if needed, or rely on next scroll event
                // But simpler to just rely on next scroll frame for now or force update
            }
        }
        window.addEventListener("resize", handleResize);
        handleResize(); // Initial size
        return () => window.removeEventListener("resize", handleResize);
    }, [frameIndex]);


    return (
        <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                />
                {!imagesLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-neon-cyan/50 font-mono">
                        LOADING 3D ASSETS...
                    </div>
                )}
            </div>
        </div>
    );
}
