"use client";

import { useRouter } from "next/navigation";
import GroupHeader from "@/components/chat/GroupHeader";
import ChatInput from "@/components/chat/ChatInput";
import ChatBubble from "@/components/chat/ChatBubble";

const GROUP_MESSAGES = [
    {
        id: "1",
        text: "Please remember to lock the main gate after 10 PM.",
        sender: "Super Admin",
        phone: "+1 000 000 000",
        isMe: false,
        time: "09:00 AM",
        type: "announcement" as const
    },
    {
        id: "2",
        text: "Noted, sir.",
        sender: "John (Block A)",
        phone: "+1 555 012 345",
        isMe: false,
        time: "09:05 AM"
    },
    {
        id: "3",
        text: "I will check the perimeter tonight.",
        sender: "Mike (Head Caretaker)",
        phone: "+1 987 654 321",
        isMe: true,
        time: "09:10 AM"
    },
    {
        id: "4",
        text: "⚠️ Water supply maintenance scheduled for tomorrow 2-4 PM.",
        sender: "Super Admin",
        phone: "+1 000 000 000",
        isMe: false,
        time: "11:00 AM",
        type: "warning" as const
    }
];

export default function CaretakerGroupChatPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-[#0b1121] relative">
            <GroupHeader
                groupName="Caretakers Main Hub"
                onInfoClick={() => router.push('/caretaker/chat/group/info')}
            />

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto pt-20 pb-20 px-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <div className="max-w-4xl mx-auto space-y-2">
                    <div className="flex justify-center my-4">
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded-full shadow-sm">
                            Messages expire after 2 months
                        </span>
                    </div>

                    {GROUP_MESSAGES.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                </div>
            </div>

            <ChatInput />
        </div>
    );
}
