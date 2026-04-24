"use client";

import { MessageSquare, Users, Search } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-140px)] flex rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50 backdrop-blur-sm">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#0066FF]"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* Mock Chat Items */}
                    <div className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors border-l-2 border-[#0066FF]">
                        <div className="flex justify-between mb-1">
                            <span className="font-medium text-white">Admin Team</span>
                            <span className="text-[10px] text-slate-500">10:42 AM</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">Please review the Q1 budget proposal when you...</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors border-l-2 border-transparent">
                        <div className="flex justify-between mb-1">
                            <span className="font-medium text-slate-200">Maintenance</span>
                            <span className="text-[10px] text-slate-500">Yesterday</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">Invoice #9921 for plumbing has been uploaded.</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/30">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Select a conversation</h3>
                <p className="text-slate-400 text-sm max-w-sm text-center">
                    You can chat with Admins, Caretakers, and Staff. Tenant communication is read-only or via official announcements.
                </p>
                <button className="mt-6 px-4 py-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    New Message
                </button>
            </div>
        </div>
    );
}
