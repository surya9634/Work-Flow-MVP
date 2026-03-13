"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, User, Bot, Loader2 } from "lucide-react";

interface Turn {
    role: "human" | "agent";
    text: string;
}

interface ActiveCall {
    callSid: string;
    agentId?: string;
    leadId?: string;
    transcript: Turn[];
    isActive: boolean;
}

export default function LiveMonitoringPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [calls, setCalls] = useState<Record<string, ActiveCall>>({});
    const [isConnected, setIsConnected] = useState(false);
    const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        // Connect to the Socket.IO server running on the same origin
        const socketIo = io();

        socketIo.on("connect", () => {
            console.log("Connected to Live Call Monitoring WebSocket:", socketIo.id);
            setIsConnected(true);
        });

        socketIo.on("disconnect", () => {
            console.log("Disconnected from WebSocket");
            setIsConnected(false);
        });

        socketIo.on("callStart", (data: { callSid: string; agentId?: string; leadId?: string }) => {
            setCalls((prev) => ({
                ...prev,
                [data.callSid]: {
                    callSid: data.callSid,
                    agentId: data.agentId,
                    leadId: data.leadId,
                    transcript: [],
                    isActive: true,
                },
            }));
        });

        socketIo.on("turn", (data: { callSid: string; role: "human" | "agent"; text: string }) => {
            setCalls((prev) => {
                const call = prev[data.callSid];
                if (!call) return prev; // Cannot update a call we don't know about

                return {
                    ...prev,
                    [data.callSid]: {
                        ...call,
                        transcript: [...call.transcript, { role: data.role, text: data.text }],
                    },
                };
            });
        });

        socketIo.on("callEnd", (data: { callSid: string }) => {
            setCalls((prev) => {
                const call = prev[data.callSid];
                if (!call) return prev;

                return {
                    ...prev,
                    [data.callSid]: {
                        ...call,
                        isActive: false,
                    },
                };
            });
        });

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, []);

    // Auto-scroll to the bottom of the transcript when new messages arrive
    useEffect(() => {
        Object.keys(calls).forEach((callSid) => {
            const el = scrollRefs.current[callSid];
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        });
    }, [calls]);

    const activeCallList = Object.values(calls).filter((c) => c.isActive);
    const completedCallList = Object.values(calls).filter((c) => !c.isActive);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Live Call Monitoring</h1>
                    <p className="text-muted-foreground mt-1">
                        Watch active agent interactions in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                            }`}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                        {isConnected ? "Socket Connected" : "Connecting..."}
                    </span>
                </div>
            </div>

            {/* Active Calls Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-medium tracking-tight">Active Transcripts</h2>
                {activeCallList.length === 0 ? (
                    <div className="border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-50" />
                        <p>No active calls detected at this moment.</p>
                        <p className="text-sm">Start an outbound campaign or call your Twilio number to see live transcripts here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeCallList.map((call) => (
                            <CallCard
                                key={call.callSid}
                                call={call}
                                scrollRef={(el) => (scrollRefs.current[call.callSid] = el)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Recently Completed Calls */}
            {completedCallList.length > 0 && (
                <div className="space-y-4 pt-12 border-t">
                    <h2 className="text-xl font-medium tracking-tight text-muted-foreground">Recently Completed</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-60">
                        {completedCallList.map((call) => (
                            <CallCard
                                key={call.callSid}
                                call={call}
                                scrollRef={(el) => (scrollRefs.current[call.callSid] = el)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CallCard({ call, scrollRef }: { call: ActiveCall; scrollRef: (el: HTMLDivElement | null) => void }) {
    return (
        <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${call.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {call.isActive ? <Phone className="h-4 w-4" /> : <PhoneOff className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className="font-medium text-sm">Call #{call.callSid.slice(-6)}</p>
                        <p className="text-xs text-muted-foreground">
                            {call.isActive ? "In Progress..." : "Call Ended"}
                        </p>
                    </div>
                </div>
                {call.isActive && (
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            {/* Transcript Scroller */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-6 bg-muted/10 cursor-ns-resize"
                style={{ scrollBehavior: 'smooth' }}
            >
                {call.transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm italic opacity-50 space-y-2">
                        <div className="flex gap-1 items-center">
                            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce delay-75"></div>
                            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce delay-150"></div>
                            <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce delay-300"></div>
                        </div>
                        <span>Waiting for caller to speak...</span>
                    </div>
                ) : (
                    call.transcript.map((turn, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${turn.role === "human" ? "flex-row" : "flex-row-reverse"}`}
                        >
                            <div className={`mt-1 flex-shrink-0 ${turn.role === "human" ? "text-blue-500" : "text-amber-500"}`}>
                                {turn.role === "human" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div
                                className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm ${turn.role === "human"
                                        ? "bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 rounded-tl-sm"
                                        : "bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-tr-sm"
                                    }`}
                            >
                                {turn.text}
                            </div>
                        </div>
                    ))
                )}
                {call.isActive && call.transcript.length > 0 && (
                    <div className="flex gap-2 items-center opacity-30 px-2 py-4">
                        <div className="h-1.5 w-1.5 bg-foreground rounded-full animate-pulse"></div>
                        <div className="h-1.5 w-1.5 bg-foreground rounded-full animate-pulse delay-75"></div>
                        <div className="h-1.5 w-1.5 bg-foreground rounded-full animate-pulse delay-150"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
