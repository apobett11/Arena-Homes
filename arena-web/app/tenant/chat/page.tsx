"use client";

import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ChatInput from "@/components/chat/ChatInput";
import ChatBubble from "@/components/chat/ChatBubble";

const MOCK_MESSAGES = [
    {
        id: "1",
        text: "Hello, I have a question about the water heater.",
        sender: "Me",
        phone: "+1 234 567 890",
        isMe: true,
        time: "10:30 AM"
    },
    {
        id: "2",
        text: "Hi there! Sure, what seems to be the issue?",
        sender: "Mike (Caretaker)",
        phone: "+1 987 654 321",
        isMe: false,
        time: "10:32 AM"
    },
    {
        id: "3",
        text: "It's making a strange noise when I turn it on.",
        sender: "Me",
        phone: "+1 234 567 890",
        isMe: true,
        time: "10:33 AM"
    }
];

export default function TenantChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState(MOCK_MESSAGES);

    const handleSend = (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: String(Date.now()),
                text,
                sender: "Me",
                phone: "+1 234 567 890",
                isMe: true,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
        ]);
    };

    return (
        <div className="flex flex-col h-screen bg-[#020617] relative">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-slate-300 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <span className="font-bold text-slate-400">MC</span>
                        </div>
                        <div>
                            <h1 className="text-white font-medium">Mike (Caretaker)</h1>
                            <p className="text-xs text-[#00D084]">Online</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-[#0066FF]">
                    <button className="hover:bg-slate-800 p-2 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                    <button className="hover:bg-slate-800 p-2 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
                    <button className="hover:bg-slate-800 p-2 rounded-full transition-colors text-slate-300"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto pt-20 pb-20 px-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                <div className="max-w-4xl mx-auto space-y-2">
                    <div className="text-center text-xs text-slate-500 my-4">Today</div>
                    {messages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                </div>
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} />
        </div>
    );
}
