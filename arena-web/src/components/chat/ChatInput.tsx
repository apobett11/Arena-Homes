"use client";

import { useState } from "react";
import { Smile, Paperclip, Camera, Send } from "lucide-react";

interface ChatInputProps {
    onSend?: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
    const [value, setValue] = useState("");

    const submit = () => {
        const text = value.trim();
        if (!text) return;
        onSend?.(text);
        setValue("");
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 p-2 md:p-3 pb-safe z-40">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <div className="flex-1 bg-slate-800 rounded-2xl flex items-center p-2 gap-2 min-h-[44px]">
                    <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors">
                        <Smile className="w-6 h-6" />
                    </button>

                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none py-1 max-h-32 overflow-y-auto"
                    />

                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors rotate-45">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <button onClick={submit} className="p-3 bg-[#00D084] hover:bg-[#00a669] rounded-full text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center">
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </div>
        </div>
    );
}
