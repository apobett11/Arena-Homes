"use client";

import { LayoutDashboard, Users, Building2, Wallet, Megaphone, Settings, UserCog, Key } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin/dashboard" },
    { icon: Users, label: "Employees", href: "/admin/employees" },
    { icon: Building2, label: "Properties", href: "/admin/properties" },
    { icon: Wallet, label: "Finance", href: "/admin/finance" },
    { icon: Megaphone, label: "Broadcast", href: "/admin/broadcast" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-50">
            <div className="flex flex-col h-full">
                {/* Brand / Logo */}
                <div className="p-6 border-b border-slate-800">
                    <Link href="/" className="block">
                        <h1 className="text-xl font-bold text-white">
                            Arena<span className="text-primary">Homes</span>
                        </h1>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Super Admin</p>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-500 group-hover:text-white"}`} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <div className="px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">System</div>
                        <Link href="/admin/access/tenants" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                            <UserCog className="w-4 h-4" />
                            <span className="text-sm">User Access</span>
                        </Link>
                        <Link href="/admin/access/keys" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                            <Key className="w-4 h-4" />
                            <span className="text-sm">Permissions</span>
                        </Link>
                    </div>
                </nav>

                {/* Admin User Profile */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-premium flex items-center justify-center text-sm font-bold text-white">
                            SA
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">Super Admin</div>
                            <div className="text-xs text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Online
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
