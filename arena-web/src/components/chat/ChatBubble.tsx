"use client";

import { useState } from "react";
import ContactPopup from "./ContactPopup";

interface ChatBubbleProps {
    message: {
        id: string;
        text: string;
        sender: string;
        phone: string;
        isMe: boolean;
        time: string;
        type?: "normal" | "announcement" | "warning";
    };
}

export default function ChatBubble({ message }: ChatBubbleProps) {
    const [showPopup, setShowPopup] = useState(false);

    const getBubbleStyle = () => {
        if (message.type === "announcement") return "bg-orange-500/20 border-orange-500/30 text-orange-200";
        if (message.type === "warning") return "bg-red-500/20 border-red-500/30 text-red-200";
        if (message.isMe) return "bg-[#005c4b] text-white"; // WhatsApp-ish sent "green" - using a darker teal for better contrast in dark mode
        return "bg-slate-800 text-slate-200"; // Received
    };

    return (
        <>
            <div className={`flex w-full ${message.isMe ? "justify-end" : "justify-start"} mb-4`}>
                <div className={`max-w-[75%] md:max-w-[60%] rounded-lg p-2 shadow-sm relative ${getBubbleStyle()} ${message.isMe ? "rounded-tr-none" : "rounded-tl-none"
                    }`}>
                    {/* Message Header (Sender Info) - as per prompt requirements even for 1-1 */}
                    <div
                        className={`text-xs font-bold mb-1 cursor-pointer hover:underline ${message.isMe ? "text-slate-300" : "text-[#00D084]"} ${(message.type === "announcement" || message.type === "warning") ? "text-white" : ""
                            }`}
                        onClick={() => setShowPopup(true)}
                    >
                        {message.sender} <span className="font-normal opacity-70 ml-1">{message.phone}</span>
                    </div>

                    {/* Message Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                    </p>

                    {/* Timestamp */}
                    <div className="text-[10px] text-right mt-1 opacity-60">
                        {message.time}
                    </div>
                </div>
            </div>

            <ContactPopup
                isOpen={showPopup}
                onClose={() => setShowPopup(false)}
                user={{ name: message.sender, phone: message.phone }}
            />
        </>
    );
}
