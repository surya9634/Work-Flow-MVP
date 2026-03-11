"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, Mic, Volume2, Loader2, Sparkles, RefreshCw, MessageSquare } from "lucide-react"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"

type Message = {
    role: "user" | "assistant"
    content: string
    audio?: string
}

type Agent = {
    id: string
    name: string
    status: string
    systemPrompt: string | null
    openingScript: string | null
    voiceProfile: string | null
}

const VOICE_OPTIONS = [
    // English (Neural)
    { id: "en-US-AriaNeural", name: "Aria (English)", gender: "female", tone: "Natural Neural" },
    { id: "en-US-SteffanNeural", name: "Steffan (English)", gender: "male", tone: "Professional Neural" },
    { id: "en-GB-SoniaNeural", name: "Sonia (British)", gender: "female", tone: "British Neural" },
    { id: "en-GB-RyanNeural", name: "Ryan (British)", gender: "male", tone: "British Neural" },

    // Hindi (Neural)
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi)", gender: "female", tone: "Natural Hindi" },
    { id: "hi-IN-MadhurNeural", name: "Madhur (Hindi)", gender: "male", tone: "Professional Hindi" },
]

export default function SandboxPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<string>("")
    const [messages, setMessages] = useState<Message[]>([])
    // history is the authoritative {role, content}[] list fed to the API
    const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([])
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isCallActive, setIsCallActive] = useState(false)
    const [activeCallId, setActiveCallId] = useState<string | null>(null)
    const [isLoadingAgents, setIsLoadingAgents] = useState(true)
    const [mode, setMode] = useState<"text" | "voice">("text")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)
    const vadCtxRef = useRef<AudioContext | null>(null)
    const vadStreamRef = useRef<MediaStream | null>(null)
    const vadFrameRef = useRef<number | null>(null)

    const isRecordingRef = useRef(false)
    const isSendingRef = useRef(false)
    const isPlayingRef = useRef(false)

    useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])
    useEffect(() => { isSendingRef.current = isSending }, [isSending])
    useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

    useEffect(() => {
        return () => {
            endCall()
        }
    }, [])

    useEffect(() => {
        fetch("/api/agents")
            .then((r) => r.json())
            .then((d) => {
                const fetchedAgents = d.agents || []
                setAgents(fetchedAgents)
                if (fetchedAgents.length > 0) {
                    setSelectedAgent(fetchedAgents[0].id)
                }
            })
            .finally(() => setIsLoadingAgents(false))
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const sendText = async () => {
        if (!input.trim() || isSending) return
        const userMsg = input.trim()
        setInput("")
        setMessages((prev) => [...prev, { role: "user", content: userMsg }])
        setIsSending(true)

        const currentHistory = [...history, { role: "user" as const, content: userMsg }]

        try {
            const res = await fetch("/api/sandbox/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    agentId: selectedAgent || undefined,
                    history: history,
                }),
            })
            const data = await res.json()
            const reply = data.response || "I didn't understand that."
            setMessages((prev) => [...prev, { role: "assistant", content: reply }])
            setHistory(data.history || [...currentHistory, { role: "assistant" as const, content: reply }])
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", content: "Error reaching the AI agent. Check your connection." }])
            setHistory(currentHistory)
        } finally {
            setIsSending(false)
        }
    }

    const sendVoice = async (blob: Blob) => {
        setIsSending(true)
        setMessages((prev) => [...prev, { role: "user", content: "🎤 [Voice message]" }])
        try {
            const formData = new FormData()
            formData.append("audio", blob, "recording.webm")
            if (selectedAgent) formData.append("agentId", selectedAgent)
            formData.append("conversationHistory", JSON.stringify(
                history.map((h) => `${h.role === "user" ? "User" : "Agent"}: ${h.content}`)
            ))

            const res = await fetch("/api/sandbox/voice", { method: "POST", body: formData })
            const data = await res.json()

            const transcript = data.userTranscript || ""
            const reply = data.response || ""

            if (transcript) {
                setMessages((prev) => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: "user", content: `🎤 "${transcript}"` }
                    return updated
                })
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: reply, audio: data.audioBase64 },
            ])

            if (transcript) {
                setHistory((prev) => [
                    ...prev,
                    { role: "user" as const, content: transcript },
                    { role: "assistant" as const, content: reply },
                ].slice(-40))
            }
            console.log(`[Sandbox] Voice response received: voice=${data.voiceId}, agent=${data.agentName}`)

            if (data.audioBase64) {
                console.log(`[Sandbox] Playing Cloud Neural Audio for: ${data.voiceId}`)
                const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`)
                currentAudioRef.current = audio

                audio.onended = () => {
                    setIsPlaying(false)
                    currentAudioRef.current = null
                }

                setIsPlaying(true)
                audio.play()
            }
        } catch (err: any) {
            console.error("[Sandbox] Voice processing failed:", err)
            setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message || "Voice processing failed."}` }])
        } finally {
            setIsSending(false)
        }
    }

    const startCall = async () => {
        try {
            // 1. Initialize call log in database for live monitoring
            if (selectedAgent) {
                const initRes = await fetch("/api/voice/call/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ agentId: selectedAgent })
                });
                const initData = await initRes.json();
                if (initData.callId) setActiveCallId(initData.callId);
            }

            // 2. Request mic access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true }
            })
            vadStreamRef.current = stream

            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            chunksRef.current = []
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
            recorder.onstop = async () => {
                if (chunksRef.current.length > 0) {
                    const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                    await sendVoice(blob)
                }
                chunksRef.current = [] // reset chunks
            }

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioCtx = new AudioContextClass()
            vadCtxRef.current = audioCtx

            const source = audioCtx.createMediaStreamSource(stream)
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)

            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            let speechFrames = 0
            let silenceFrames = 0

            const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray)
                let sum = 0
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
                const avg = sum / dataArray.length

                if (avg > 15) { // Speaking
                    speechFrames++
                    silenceFrames = 0
                    if (speechFrames > 5) {
                        if (isPlayingRef.current) {
                            if (currentAudioRef.current) {
                                currentAudioRef.current.pause()
                                currentAudioRef.current = null
                            }
                            setIsPlaying(false)
                            setMessages(prev => [...prev, { role: "assistant", content: "⏸️ [Interrupted by user]" }])
                            setHistory(prev => [...prev, { role: "assistant" as const, content: "[User interrupted the agent]" }])
                        }
                        if (!isRecordingRef.current && !isSendingRef.current) {
                            chunksRef.current = []
                            mediaRecorderRef.current?.start()
                            setIsRecording(true)
                        }
                    }
                } else { // Silent
                    speechFrames = 0
                    if (isRecordingRef.current) {
                        silenceFrames++
                        if (silenceFrames > 90) { // ~1.5s silence
                            if (mediaRecorderRef.current?.state === "recording") {
                                mediaRecorderRef.current.stop()
                            }
                            setIsRecording(false)
                            silenceFrames = 0
                        }
                    }
                }

                vadFrameRef.current = requestAnimationFrame(checkVolume)
            }
            checkVolume()
            setIsCallActive(true)
        } catch (e) {
            console.error("Call setup failed", e)
            alert("Microphone access denied or error starting call.")
        }
    }

    const endCall = () => {
        setIsCallActive(false)
        setIsRecording(false)
        setIsPlaying(false)

        if (vadFrameRef.current) {
            cancelAnimationFrame(vadFrameRef.current)
            vadFrameRef.current = null
        }
        if (vadCtxRef.current) {
            vadCtxRef.current.close().catch(console.error)
            vadCtxRef.current = null
        }
        if (vadStreamRef.current) {
            vadStreamRef.current.getTracks().forEach((t) => t.stop())
            vadStreamRef.current = null
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause()
            currentAudioRef.current = null
        }
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.onstop = null // Prevent sending chunks if user manually stops call
            mediaRecorderRef.current.stop()
        }

        // Finalize call in database if we had one
        if (activeCallId) {
            fetch(`/api/voice/call/${activeCallId}/end`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript: history.map((h) => `${h.role === "user" ? "User" : "Agent"}: ${h.content}`),
                    duration: 0, // Could track actual duration here
                })
            }).catch(e => console.error("Error ending call log:", e));
            setActiveCallId(null);
        }
    }

    const selectedAgentObj = agents.find((a) => a.id === selectedAgent)

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] -mt-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-400" />
                        Agent Sandbox
                    </h2>
                    <p className="text-zinc-500 mt-1 text-sm">Test your AI agent live before going live</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-1">
                        <button
                            onClick={() => setMode("text")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "text" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <MessageSquare className="h-3 w-3" /> Text
                        </button>
                        <button
                            onClick={() => setMode("voice")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "voice" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <Mic className="h-3 w-3" /> Voice
                        </button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-8 text-xs"
                        onClick={() => { setMessages([]); setHistory([]) }}
                    >
                        <RefreshCw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                </div>
            </div>

            {/* Agent selector */}
            {isLoadingAgents ? (
                <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 mb-4 flex items-center gap-2 text-zinc-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading agents...
                </div>
            ) : agents.length === 0 ? (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mb-4">
                    <p className="text-amber-400 text-sm font-medium">No agents found</p>
                    <p className="text-zinc-500 text-xs mt-1">Complete the AI onboarding first to generate your agent, then test it here.</p>
                </div>
            ) : (
                <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 mb-4 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Testing agent:</span>
                        <div className="flex gap-2 flex-wrap">
                            {agents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => setSelectedAgent(agent.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedAgent === agent.id
                                        ? "bg-purple-600 border-purple-500 text-white"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                >
                                    <Bot className="h-3 w-3" />
                                    {agent.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedAgentObj && (
                        <div className="flex items-center gap-3 border-t border-zinc-800/50 pt-3">
                            <span className="text-xs text-zinc-500 font-medium">Persistent Persona:</span>
                            <div className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white flex items-center gap-2">
                                <Volume2 className="h-3.5 w-3.5 text-purple-400" />
                                {(() => {
                                    try {
                                        const vp = JSON.parse(selectedAgentObj.voiceProfile || "{}");
                                        const voice = VOICE_OPTIONS.find(v => v.id === vp.voiceId) || VOICE_OPTIONS[0];
                                        return <span>{voice.name} ({voice.gender})</span>
                                    } catch {
                                        return <span>Default (Female)</span>
                                    }
                                })()}
                            </div>
                            <button
                                onClick={() => window.location.href = "/dashboard/agents"}
                                className="text-[10px] text-zinc-600 hover:text-purple-400 transition-colors"
                            >
                                Change Persona →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 space-y-4 mb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                            <Bot className="h-8 w-8 text-purple-400" />
                        </div>
                        <p className="text-zinc-400 font-medium mb-1">
                            {mode === "text" ? "Type a message to start" : "Click the mic button to speak"}
                        </p>
                        <p className="text-zinc-600 text-sm">
                            Your AI agent will respond based on its configured personality and objectives.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user"
                                ? "bg-zinc-700 text-zinc-300 text-xs font-bold"
                                : "bg-purple-500/20 border border-purple-500/30"
                                }`}>
                                {msg.role === "user" ? "You" : <Bot className="h-4 w-4 text-purple-400" />}
                            </div>
                            <div className="flex items-start gap-1.5 max-w-[75%]">
                                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-zinc-800 text-zinc-100 rounded-tr-sm"
                                    : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
                                    }`}>
                                    {msg.content}
                                </div>
                                {msg.role === "assistant" && (
                                    <button
                                        title="Read aloud"
                                        onClick={async () => {
                                            if (msg.audio) {
                                                new Audio(`data:audio/mpeg;base64,${msg.audio}`).play()
                                            } else {
                                                try {
                                                    const res = await fetch("/api/sandbox/tts", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            text: msg.content,
                                                            agentId: selectedAgent
                                                        }),
                                                    })
                                                    const data = await res.json()

                                                    if (data.audioBase64) {
                                                        console.log(`[Realistic-Replay] Playing cloud audio for: ${selectedAgent}`)
                                                        new Audio(`data:audio/mpeg;base64,${data.audioBase64}`).play()
                                                    }
                                                } catch (err) {
                                                    console.error("TTS failed:", err)
                                                }
                                            }
                                        }}
                                        className="mt-2 p-1.5 rounded-lg text-zinc-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all shrink-0"
                                    >
                                        <Volume2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isSending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {mode === "text" ? (
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendText()}
                        placeholder="Type a message to test your agent..."
                        disabled={isSending || !selectedAgent}
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500"
                    />
                    <Button
                        onClick={sendText}
                        disabled={!input.trim() || isSending || !selectedAgent}
                        className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                    <AIVoiceInput 
                        onStart={startCall}
                        onStop={endCall}
                        className={!selectedAgent ? "opacity-50 pointer-events-none" : undefined}
                    />
                    <p className="text-xs text-zinc-500 font-medium h-4">
                        {!isCallActive ? "Click to start call"
                            : isPlaying ? "Agent speaking... (Interrupt anytime)"
                                : isSending ? "Processing..."
                                    : isRecording ? "Listening..."
                                        : "Call active — waiting for you to speak..."}
                    </p>
                </div>
            )}
        </div>
    )
}
