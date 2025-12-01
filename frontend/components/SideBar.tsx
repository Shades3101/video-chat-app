"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizonal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "./ToggleSwitch";

export function InCallChatPanel({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = {
            id: Date.now(),
            text: input,
            sender: "me",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => [...prev, newMsg]);
        setInput("");

        // TODO: ws.send(JSON.stringify({ type: "chat", message: newMsg }))
    };

    return (
        <div className="flex flex-col h-full w-96 bg-[#1a1a1a] border-l border-white/10 rounded-l-3xl overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">In-call messages</h2>
                <button onClick={onClose} className="text-white/70 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* SETTINGS */}
            <div className="p-4 space-y-4">

                {/* Toggle 1 */}
                <div className="flex items-center justify-between bg-black/30 border border-white/10 rounded-xl p-3">
                    <span className="text-white/90">Let participants send messages</span>
                    <ToggleSwitch />
                </div>

                {/* Continuous chat box */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white/80 space-y-2">
                    <p className="flex items-center gap-2 font-medium">
                        💬 Continuous chat is OFF
                    </p>
                    <p>Messages won't be saved when the call ends. You can pin a message to make it visible for people who join later.</p>
                </div>

                {pinnedMessage && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white/90">
                        📌 {pinnedMessage}
                    </div>
                )}
            </div>

            {/* MESSAGE LIST */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 text-white/90">

                {messages.length === 0 && (
                    <p className="text-center text-white/40 mt-10">No messages yet</p>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col">
                        <span
                            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "me"
                                    ? "ml-auto bg-blue-600 text-white"
                                    : "mr-auto bg-white/10"
                                }`}
                        >
                            {msg.text}
                        </span>

                        {/* Timestamp */}
                        <span
                            className={`text-xs mt-1 ${msg.sender === "me" ? "text-right text-white/40" : "text-left text-white/40"
                                }`}
                        >
                            {msg.time}
                        </span>

                        {/* Pin button */}
                        {msg.sender === "me" && (
                            <button
                                onClick={() => setPinnedMessage(msg.text)}
                                className="text-xs mt-1 ml-auto text-white/40 hover:text-white"
                            >
                                📌 Pin
                            </button>
                        )}
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR */}
            <div className="p-4">
                <form
                    onSubmit={sendMessage}
                    className="flex items-center bg-black/20 border border-white/10 rounded-2xl px-4 py-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send a message"
                        className="border-0 shadow-none bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0"
                    />

                    <Button type="submit" size="icon" variant="ghost" className="text-white/80 hover:text-white">
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
