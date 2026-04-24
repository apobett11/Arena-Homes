'use client';

import React from 'react';
import { Home, CreditCard, FileText, Settings, User, Bell, Moon, Sun, MessageSquare } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileNav = () => {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const navItems = [
        { icon: Home, label: 'Home', href: '/tenant/dashboard' },
        { icon: CreditCard, label: 'Pay', href: '/tenant/dashboard' },
        { icon: MessageSquare, label: 'Report', href: '/tenant/chat' },
        { icon: FileText, label: 'Lease', href: '/tenant/dashboard' },
        { icon: Settings, label: 'Settings', href: '/tenant/dashboard' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50 md:hidden">
            <div className="flex justify-around items-center p-3">
                {navItems.map((item) => (
                    <Link href={item.href} key={item.label} className={`flex flex-col items-center gap-1 transition-colors ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        <item.icon size={22} strokeWidth={isActive(item.href) ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export const DesktopSidebar = () => {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    const navItems = [
        { icon: Home, label: 'Dashboard', href: '/tenant/dashboard' },
        { icon: CreditCard, label: 'Payments', href: '/tenant/dashboard' },
        { icon: MessageSquare, label: 'Report Issue', href: '/tenant/chat' },
        { icon: FileText, label: 'Lease Agreement', href: '/tenant/dashboard' },
        { icon: Settings, label: 'Settings', href: '/tenant/dashboard' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-white dark:bg-[#020617] border-r border-gray-200 dark:border-gray-800 z-40 pt-20 px-4">
            <div className="space-y-2 mt-6">
                {navItems.map((item) => (
                    <Link href={item.href} key={item.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href) ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-auto mb-8 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <h4 className="font-bold relative z-10">Need Help?</h4>
                <p className="text-xs text-blue-100 mt-1 relative z-10 mb-3">Contact the caretaker directly.</p>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-xs font-semibold transition-colors">Chat Now</button>
            </div>
        </aside>
    );
};

export const TopBar = () => {
    const { theme, setTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
                <span className="font-bold text-xl tracking-tight hidden md:block">Arena Homes</span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#020617]"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 overflow-hidden">
                        <User className="w-full h-full p-1 text-gray-400" />
                    </div>
                </div>
            </div>
        </header>
    );
};
