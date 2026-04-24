"use client";

import { ArrowLeft, Phone, Video, Search, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ContactPopup from "@/components/chat/ContactPopup";

const MEMBERS = [
    { id: 1, name: "Super Admin", phone: "+1 000 000 000", role: "Super Admin", isAdmin: true },
    { id: 2, name: "Mike Chen", phone: "+1 987 654 321", role: "Group Admin", isAdmin: true },
    { id: 3, name: "John Doe", phone: "+1 555 012 345", role: "Caretaker", isAdmin: false },
    { id: 4, name: "Sarah Smith", phone: "+1 555 987 654", role: "Caretaker", isAdmin: false },
    { id: 5, name: "Alex Jones", phone: "+1 555 111 222", role: "Caretaker", isAdmin: false },
];

export default function GroupInfoPage() {
    const router = useRouter();
    const [selectedMember, setSelectedMember] = useState<typeof MEMBERS[0] | null>(null);

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="max-w-2xl mx-auto pb-8">
                {/* Header */}
                <div className="bg-[#0f172a] p-4 flex items-center gap-3 sticky top-0 z-40 border-b border-slate-800">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold text-lg">Group Info</h1>
                </div>

                {/* Group Identity */}
                <div className="flex flex-col items-center py-8 bg-[#0f172a] border-b border-slate-800 mb-4">
                    <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold mb-4 shadow-2xl ring-4 ring-slate-800">
                        C
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Caretakers Main Hub</h2>
                    <p className="text-slate-400 text-sm">Created by: Super Admin</p>

                    <div className="flex items-center gap-6 mt-6">
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-[#0066FF]/20 text-[#0066FF] transition-colors">
                                <Phone className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-400">Audio</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-[#00D084]/20 text-[#00D084] transition-colors">
                                <Video className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-400">Video</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 text-slate-300 transition-colors">
                                <Search className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-400">Search</span>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-[#0f172a] p-4 mb-4 border-y border-slate-800">
                    <h3 className="text-sm font-semibold text-[#0066FF] mb-2 uppercase tracking-wide">Description</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Official coordination channel for all Arena Homes caretakers. Use this group for incident reporting, shift handovers, and general announcements.
                        Messages here are monitored by the Admin team.
                    </p>
                </div>

                {/* Members */}
                <div className="bg-[#0f172a] border-y border-slate-800">
                    <div className="p-4 pb-2">
                        <h3 className="text-sm font-semibold text-[#0066FF] uppercase tracking-wide">
                            {MEMBERS.length} Participants
                        </h3>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {MEMBERS.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-4 p-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
                                onClick={() => setSelectedMember(member)}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                        <User className="w-5 h-5" />
                                    </div>
                                    {member.isAdmin && (
                                        <div className="absolute -bottom-1 -right-1 bg-[#0f172a] rounded-full p-0.5">
                                            <Shield className="w-3 h-3 text-[#00D084]" fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-white">{member.name}</h4>
                                        {member.isAdmin && (
                                            <span className="text-[10px] bg-[#00D084]/10 text-[#00D084] px-1.5 py-0.5 rounded border border-[#00D084]/20">
                                                {member.role}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{member.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Popup */}
            {selectedMember && (
                <ContactPopup
                    isOpen={!!selectedMember}
                    onClose={() => setSelectedMember(null)}
                    user={selectedMember}
                />
            )}
        </div>
    );
}
