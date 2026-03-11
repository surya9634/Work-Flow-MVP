"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Clock, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from "lucide-react"

export function ActivityThread({ thread }: { thread: any }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden transition-all duration-300">
            {/* Header (Always Visible) */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/80 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
                        {thread.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-100 text-lg">{thread.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last active {new Date(thread.latestActivity).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                {thread.callCount > 0 && <span className="text-indigo-400">{thread.callCount} Calls</span>}
                                {thread.callCount > 0 && thread.msgCount > 0 && " • "}
                                {thread.msgCount > 0 && <span className="text-emerald-400">{thread.msgCount} Messages</span>}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="text-zinc-500">
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {/* Expanded Body (Chronological Thread) */}
            {expanded && (
                <div className="border-t border-zinc-800/50 bg-black/40 p-4 space-y-4">
                    {/* Reverse array to show oldest first in the thread, like a real chat app */}
                    {[...thread.activities].reverse().map((item: any, idx: number) => {
                        const isCall = item.activityType === 'CALL';
                        const isOutbound = isCall ? true : item.direction === 'OUTBOUND';

                        return (
                            <div key={item.id + idx} className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {isCall ? (
                                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                                <Phone className="w-3 h-3 mr-1" /> Call
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                                            </Badge>
                                        )}

                                        <span className="text-xs text-zinc-500 flex items-center">
                                            {isOutbound ? <ArrowUpRight className="w-3 h-3 mr-1 text-zinc-400" /> : <ArrowDownLeft className="w-3 h-3 mr-1 text-zinc-400" />}
                                            {isOutbound ? "Outbound" : "Inbound"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-zinc-600">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-zinc-300 mt-1">
                                    {isCall 
                                        ? (item.transcript ? `"${item.transcript}"` : <span className="italic text-zinc-500">No transcript available. {(item.status === 'failed' || item.status === 'busy') && "Call failed or busy."}</span>)
                                        : (item.message ? item.message : <span className="italic text-zinc-500">Media attachment or empty message.</span>)
                                    }
                                </div>

                                {/* Status Details */}
                                <div className="flex gap-2 mt-2">
                                    {item.status && (
                                        <Badge variant="outline" className="text-[10px] uppercase text-zinc-500 border-zinc-800">
                                            Status: {item.status}
                                        </Badge>
                                    )}
                                    {isCall && item.duration > 0 && (
                                        <Badge variant="outline" className="text-[10px] uppercase text-zinc-500 border-zinc-800">
                                            Duration: {item.duration}s
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
