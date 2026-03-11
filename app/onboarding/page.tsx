"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    SendIcon,
    LoaderIcon,
    Sparkles,
    Bot,
    ChevronRight,
    Zap,
    CheckCircle2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
}

interface OnboardingState {
    state: string
    progress: number
    action: string
}

const STATE_LABELS: Record<string, string> = {
    STATE_BUSINESS: "Business Profile",
    STATE_GOAL: "Mission & Goals",
    STATE_PERSONA: "Agent Persona",
    STATE_OBJECTIONS: "Objection Handling",
    STATE_CONVERSION: "Conversion Logic",
    STATE_REVIEW: "Review & Confirm",
    STATE_COMPLETE: "Agent Generated ✨",
}

const QUICK_PROMPTS = [
    { label: "I run a SaaS company", icon: Zap },
    { label: "I want to book more demos", icon: ChevronRight },
    { label: "Help me set up my agent", icon: Bot },
]

export default function OnboardingPage() {
    const router = useRouter()
    const [value, setValue] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
    const [agentReady, setAgentReady] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Preserve user progress across hot-reloads and memory-saver tab sleeps
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem("ob_msgs")
            const savedState = localStorage.getItem("ob_state")
            const savedAgent = localStorage.getItem("ob_agent")
            if (savedMessages) setMessages(JSON.parse(savedMessages))
            if (savedState) setOnboardingState(JSON.parse(savedState))
            if (savedAgent) setAgentReady(JSON.parse(savedAgent))
        } catch (e) { console.error("Failed to load onboarding cache", e) }
    }, [])

    useEffect(() => {
        if (messages.length > 0) localStorage.setItem("ob_msgs", JSON.stringify(messages))
    }, [messages])

    useEffect(() => {
        if (onboardingState) localStorage.setItem("ob_state", JSON.stringify(onboardingState))
    }, [onboardingState])

    useEffect(() => {
        localStorage.setItem("ob_agent", JSON.stringify(agentReady))
    }, [agentReady])

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = "52px"
        const newHeight = Math.max(52, Math.min(textarea.scrollHeight, 160))
        textarea.style.height = `${newHeight}px`
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    const handleSendMessage = async (messageText?: string) => {
        const text = messageText || value.trim()
        if (!text) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
        setMessages((prev) => [...prev, userMsg])
        setValue("")
        setIsTyping(true)
        adjustHeight()

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            })

            const data = await res.json()

            const newState: OnboardingState = {
                state: data.state || "STATE_BUSINESS",
                progress: data.progress || 0,
                action: data.action || "continue",
            }
            setOnboardingState(newState)

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message || "I'm here to help you build your voice agent.",
            }
            setMessages((prev) => [...prev, aiMsg])

            if (data.action === "create_agent" || data.state === "STATE_COMPLETE") {
                setAgentReady(true)
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: "assistant", content: "Something went wrong. Please try again." },
            ])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const isEmpty = messages.length === 0

    return (
        <div className="relative flex min-h-screen flex-col bg-black text-white selection:bg-purple-500/30">
            {/* Premium Background Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[25%] -right-[10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Top bar - Glassmorphism */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-zinc-900/50 backdrop-blur-md bg-black/40">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Bot className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white/90 uppercase">WORK-FLOW</span>
                    <div className="h-4 w-px bg-zinc-800 mx-1" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Architect</span>
                </div>

                {/* Progress pill - Premium Glass */}
                {onboardingState && onboardingState.state !== "STATE_COMPLETE" && (
                    <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-xl">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {STATE_LABELS[onboardingState.state] || "Analyzing"}
                        </span>
                        <div className="w-20 h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full"
                                animate={{ width: `${onboardingState.progress}%` }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                        <span className="text-[10px] tabular-nums text-zinc-500 font-medium">{onboardingState.progress}%</span>
                    </div>
                )}

                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
                >
                    Exit Setup
                </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center max-w-xl space-y-8"
                        >
                            {/* Animated Icon Container */}
                            <div className="relative mx-auto w-24 h-24">
                                <motion.div
                                    className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                />
                                <div className="relative w-full h-full rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-10 h-10 text-purple-400" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                                    Let's Architect Your <br /> AI Sales Force
                                </h1>
                                <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto">
                                    Your agents will handle lead qualification, objection management, and call scheduling with human realism.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-6">
                                {QUICK_PROMPTS.map((prompt, idx) => (
                                    <motion.button
                                        key={prompt.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (idx * 0.1) }}
                                        onClick={() => handleSendMessage(prompt.label)}
                                        className="group flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm text-left text-sm text-zinc-400 hover:text-white hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-400 transition-all duration-300">
                                            <prompt.icon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="font-medium">{prompt.label}</span>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-purple-400" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
                        {/* Agent ready banner - Glassmorphism */}
                        <AnimatePresence>
                            {agentReady && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, backgroundColor: "rgba(16, 185, 129, 0)" }}
                                    animate={{ opacity: 1, scale: 1, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                                    className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-2xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-inner">
                                            <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Deployment Successful</p>
                                            <p className="text-xs text-emerald-500/80">Your agent is now live and standby.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push("/dashboard/agents")}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-9 px-5 rounded-xl shadow-lg shadow-emerald-500/20"
                                    >
                                        Dashboard →
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mr-3 mt-1 shrink-0 shadow-lg shadow-purple-500/5">
                                        <Bot className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                                        msg.role === "user"
                                            ? "bg-white text-black font-medium rounded-br-none"
                                            : "bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 text-zinc-100 rounded-bl-none"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-end gap-3"
                            >
                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 150}ms` }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                )}
            </div>

            {/* Input bar - Premium Blur */}
            <div className="relative z-50 border-t border-zinc-900/50 backdrop-blur-xl bg-black/60 px-6 py-8">
                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative rounded-2xl bg-zinc-900/80 border border-zinc-800/50 shadow-2xl focus-within:border-purple-500/30 transition-all">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value)
                                adjustHeight()
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={isEmpty ? "Tell me about your business goal..." : "Send message..."}
                            disabled={isTyping || agentReady}
                            className="min-h-[58px] max-h-[160px] border-none bg-transparent resize-none text-white placeholder:text-zinc-600 focus-visible:ring-0 text-md px-5 py-4 pr-16"
                        />
                        <div className="absolute right-3 bottom-3">
                            <motion.button
                                onClick={() => handleSendMessage()}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isTyping || !value.trim() || agentReady}
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shadow-xl",
                                    value.trim() && !agentReady
                                        ? "bg-white text-black hover:shadow-white/10"
                                        : "bg-zinc-800 text-zinc-600"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4.5 h-4.5 animate-spin" />
                                ) : (
                                    <SendIcon className="w-4.5 h-4.5" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                    <div className="mt-3 text-[10px] text-center text-zinc-600 font-medium uppercase tracking-[0.2em]">
                        Powered by Llama 3.3 Deep Synthesis
                    </div>
                </div>
            </div>
        </div>
    )
}
