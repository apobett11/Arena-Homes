"use client";

import { User, Phone, Video, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ContactPopupProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        phone: string;
        role?: string;
        avatar?: string;
    };
}

export default function ContactPopup({ isOpen, onClose, user }: ContactPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-[90%] max-w-sm bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-2xl shadow-black transform transition-all duration-200 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00D084] p-[2px]">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white max-w-[200px] mx-auto truncate">{user.name}</h3>
                        <p className="text-sm text-slate-400">{user.phone}</p>
                        {user.role && (
                            <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-300 font-medium border border-slate-700">
                                {user.role}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full mt-2">
                        <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group">
                            <div className="p-2 rounded-full bg-[#00D084]/10 group-hover:bg-[#00D084]/20 text-[#00D084]">
                                <Phone className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-300">Voice</span>
                        </button>
                        <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group">
                            <div className="p-2 rounded-full bg-[#0066FF]/10 group-hover:bg-[#0066FF]/20 text-[#0066FF]">
                                <Video className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-300">Video</span>
                        </button>
                        <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group">
                            <div className="p-2 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-500">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-300">Message</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
