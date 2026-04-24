"use client"

import React, { useState } from "react"
import { LayoutDashboard, Activity, Users, Puzzle, Settings, Bell, UserCircle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const navItems = [
        { icon: LayoutDashboard, label: "Home", href: "/it-support/dashboard" },
        { icon: Activity, label: "Monitoring", href: "#monitoring" },
        { icon: Users, label: "Users", href: "#users" },
        { icon: Puzzle, label: "Integrations", href: "#integrations" },
        { icon: Settings, label: "Settings", href: "#settings" },
    ]

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#0066FF] selection:text-white font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10 pointer-events-none" />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-white/10 bg-black/50 backdrop-blur-xl z-50">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#0066FF] flex items-center justify-center font-bold text-lg">A</div>
                    <span className="font-bold text-lg tracking-wider">ARENA IT</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <item.icon className="w-5 h-5 group-hover:text-[#0066FF] transition-colors" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-500 font-mono">SYSTEM OPTIMAL</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center px-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#0066FF] active:scale-95 transition-all"
                    >
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Main Content Area */}
            <main className="md:pl-64 min-h-screen flex flex-col relative z-0 pb-20 md:pb-0">
                {/* Top Utility Bar */}
                <header className="sticky top-0 z-40 h-16 px-6 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
                    <h1 className="text-xl font-bold md:hidden">ARENA IT</h1>
                    <div className="hidden md:block text-sm text-gray-400">
                        System Control Center
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                        </Button>
                        <div className="h-8 w-[1px] bg-white/10" />
                        <Button variant="ghost" className="text-sm font-medium text-gray-300 hover:text-white gap-2">
                            <UserCircle className="w-5 h-5" />
                            <span className="hidden md:inline">Admin</span>
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
