"use client"

import { AnimatedAIChat } from "@/components/ui/animated-ai-chat"

export default function AIAssistantPage() {
    return (
        <div className="h-[calc(100vh-4rem)] -m-6 relative overflow-hidden bg-black/50">
            <AnimatedAIChat />
        </div>
    )
}
