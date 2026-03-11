"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    SendIcon,
    LoaderIcon,
    Sparkles,
    Bot,
    ChevronRight,
    Zap,
    CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface OnboardingState {
    state: string;
    progress: number;
    action: string;
}

const STATE_LABELS: Record<string, string> = {
    STATE_BUSINESS: "Business Profile",
    STATE_GOAL: "Mission & Goals",
    STATE_PERSONA: "Agent Persona",
    STATE_OBJECTIONS: "Objection Handling",
    STATE_CONVERSION: "Conversion Logic",
    STATE_REVIEW: "Review & Confirm",
    STATE_COMPLETE: "Agent Generated",
};

const QUICK_PROMPTS = [
    { label: "I run a SaaS company", icon: Zap },
    { label: "I want to book more demos", icon: ChevronRight },
    { label: "Help me set up my agent", icon: Bot },
];

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "52px";
        const newHeight = Math.max(52, Math.min(textarea.scrollHeight, 160));
        textarea.style.height = `${newHeight}px`;
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = async (messageText?: string) => {
        const text = messageText || value.trim();
        if (!text) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setValue("");
        setIsTyping(true);
        adjustHeight();

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();

            setOnboardingState({
                state: data.state || "STATE_BUSINESS",
                progress: data.progress || 0,
                action: data.action || "continue",
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message || "I'm here to help you build your voice agent."
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Something went wrong. Please try again."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-col w-full h-full relative overflow-hidden text-white">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isEmpty ? (
                    /* ─── EMPTY STATE ─────────────────────────── */
                    <div className="flex flex-col items-center justify-center h-full px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center max-w-md space-y-6"
                        >
                            {/* Logo Mark */}
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-purple-500/5">
                                <Bot className="w-8 h-8 text-zinc-300" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-white">
                                    Build your voice agent
                                </h1>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    I'll guide you through configuring a personalized AI voice agent for your business. Just start by telling me about your company.
                                </p>
                            </div>

                            {/* Quick Prompts */}
                            <div className="flex flex-col gap-2 pt-2">
                                {QUICK_PROMPTS.map((prompt) => (
                                    <motion.button
                                        key={prompt.label}
                                        onClick={() => handleSendMessage(prompt.label)}
                                        className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-left text-sm text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200"
                                        whileHover={{ x: 4 }}
                                    >
                                        <prompt.icon className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                                        {prompt.label}
                                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* ─── MESSAGES ─────────────────────────────── */
                    <div className="p-6 space-y-4 pb-4">
                        {/* Progress Bar */}
                        {onboardingState && onboardingState.state !== "STATE_COMPLETE" && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 mb-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            {STATE_LABELS[onboardingState.state] || onboardingState.state}
                                        </span>
                                        <span className="text-[10px] font-medium text-zinc-500">
                                            {onboardingState.progress}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${onboardingState.progress}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Agent Generated Banner */}
                        {onboardingState?.state === "STATE_COMPLETE" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4"
                            >
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">Agent generated successfully</span>
                            </motion.div>
                        )}

                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex w-full",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-white text-black rounded-br-md"
                                        : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-md"
                                )}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* ─── INPUT AREA ────────────────────────────── */}
            <div className="p-4 pt-0 relative z-10">
                <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your business..."
                        className="min-h-[52px] max-h-[160px] border-none bg-transparent resize-none text-white placeholder:text-zinc-600 focus-visible:ring-0 text-sm pr-14"
                    />
                    <div className="absolute right-2 bottom-2">
                        <motion.button
                            onClick={() => handleSendMessage()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isTyping || !value.trim()}
                            className={cn(
                                "rounded-lg p-2 transition-all duration-200",
                                value.trim()
                                    ? "bg-white text-black hover:bg-zinc-200"
                                    : "bg-zinc-800 text-zinc-600"
                            )}
                        >
                            {isTyping
                                ? <LoaderIcon className="w-4 h-4 animate-spin" />
                                : <SendIcon className="w-4 h-4" />
                            }
                        </motion.button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-zinc-700 mt-2">
                    AI-powered onboarding • Your data is encrypted
                </p>
            </div>
        </div>
    );
}
