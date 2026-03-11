"use client";

import { ScrollFrameSequence } from "@/components/ui/scroll-frame-sequence";

const FRAME_COUNT = 8;

const framePath = (index: number) => {
    const paddedIndex = String(index + 1).padStart(4, "0");
    const seconds = index;
    return `/frames/frame_${paddedIndex}_${seconds}.00s.png`;
};

export function HeroFrameSequence() {
    return (
        <ScrollFrameSequence
            frameCount={FRAME_COUNT}
            framePath={framePath}
            className="w-full h-full"
        />
    );
}
