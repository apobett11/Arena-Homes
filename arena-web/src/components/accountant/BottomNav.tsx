"use client";

import { LayoutDashboard, BookOpen, PieChart, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/accountant/dashboard" },
    { icon: BookOpen, label: "Ledger", href: "/accountant/ledger" },
    { icon: PieChart, label: "Budgets", href: "/accountant/budgets" },
    { icon: FileText, label: "Reports", href: "/accountant/reports" },
    { icon: MessageSquare, label: "Chat", href: "/accountant/chat" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${isActive
                                    ? "text-[#0066FF]"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
