"use client";

import { ArrowLeft, Phone, Video, Search, Volume2, VolumeX, Sun, Moon, Info, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface GroupHeaderProps {
    groupName: string;
    groupLogo?: string;
    onInfoClick: () => void;
}

export default function GroupHeader({ groupName, groupLogo, onInfoClick }: GroupHeaderProps) {
    const router = useRouter();
    const [muted, setMuted] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 bg-[#0f172a] border-b border-slate-800 p-2 z-40 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
                <button onClick={() => router.back()} className="p-2 text-slate-300 hover:text-white active:bg-slate-800 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div onClick={onInfoClick} className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                        {groupLogo ? (
                            <img src={groupLogo} alt={groupName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                {groupName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="font-semibold text-white leading-tight truncate max-w-[150px] md:max-w-xs">{groupName}</h1>
                        <p className="text-xs text-slate-400">Tap for group info</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button className="p-2 text-[#0066FF] hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
                    <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#0066FF] hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
                    <Video className="w-5 h-5" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`p-2 rounded-full transition-colors ${menuOpen ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white"}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e293b] rounded-xl shadow-xl shadow-black/50 border border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 text-left transition-colors"
                                onClick={() => { onInfoClick(); setMenuOpen(false); }}
                            >
                                <Info className="w-4 h-4 text-slate-400" />
                                Group Info
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 text-left transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Search className="w-4 h-4 text-slate-400" />
                                Search
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 text-left transition-colors"
                                onClick={() => { setMuted(!muted); setMenuOpen(false); }}
                            >
                                {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
                                <span className={muted ? "text-red-400" : ""}>{muted ? "Unmute Notifications" : "Mute Notifications"}</span>
                            </button>
                            <div className="my-1 border-t border-slate-700/50" />
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 text-left transition-colors"
                                onClick={() => { setDarkMode(!darkMode); setMenuOpen(false); }}
                            >
                                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-400" />}
                                Theme: {darkMode ? "Light" : "Dark"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
