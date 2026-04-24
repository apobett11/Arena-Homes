"use client";

import { LayoutDashboard, Users, Building2, Wallet, Megaphone, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin/dashboard" },
    { icon: Users, label: "Staff", href: "/admin/employees" },
    { icon: Building2, label: "Properties", href: "/admin/properties" },
    { icon: Wallet, label: "Finance", href: "/admin/finance" },
    { icon: Megaphone, label: "Broadcast", href: "/admin/broadcast" },
];

export default function AdminBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all ${isActive
                                ? "text-[#0066FF]"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(0,102,255,0.5)]" : ""}`} />
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
                <button className="flex flex-col items-center justify-center gap-1 px-2 py-1 text-slate-400 hover:text-white">
                    <Menu className="w-5 h-5" />
                    <span className="text-[10px] font-medium tracking-wide">More</span>
                </button>
            </div>
        </nav>
    );
}
