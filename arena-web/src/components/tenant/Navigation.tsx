'use client';

import React from 'react';
import { Home, CreditCard, FileText, Settings, User, Bell, Moon, Sun, MessageSquare, Megaphone, Users, Star, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth';

interface TenantNavigationProps {
    onAction: (actionId: string) => void;
}

export const MobileNav = ({ onAction }: TenantNavigationProps) => {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const navItems = [
        { icon: Home, label: 'Home', actionId: 'home' },
        { icon: CreditCard, label: 'Pay', actionId: 'pay_sidebar' },
        { icon: MessageSquare, label: 'Report', actionId: 'report' },
        { icon: FileText, label: 'Lease', actionId: 'lease' },
        { icon: Settings, label: 'Settings', actionId: 'settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50 md:hidden">
            <div className="flex justify-around items-center p-3">
                {navItems.map((item) => (
                    <button key={item.label} onClick={() => onAction(item.actionId)} className={`flex flex-col items-center gap-1 transition-colors ${item.actionId === "home" && isActive('/tenant/dashboard') ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        <item.icon size={22} strokeWidth={item.actionId === "home" && isActive('/tenant/dashboard') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const DesktopSidebar = ({ onAction }: TenantNavigationProps) => {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    const navItems = [
        { icon: Home, label: 'Dashboard', actionId: 'home' },
        { icon: CreditCard, label: 'Pay Rent', actionId: 'pay_sidebar' },
        { icon: MessageSquare, label: 'Report Issue', actionId: 'report' },
        { icon: FileText, label: 'View Lease', actionId: 'lease' },
        { icon: Megaphone, label: 'Announcements', actionId: 'announcements' },
        { icon: Users, label: 'Community', actionId: 'community' },
        { icon: Star, label: 'Feedback', actionId: 'feedback' },
        { icon: Settings, label: 'Settings', actionId: 'settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-white dark:bg-[#020617] border-r border-gray-200 dark:border-gray-800 z-40 pt-20 px-4">
            <div className="space-y-2 mt-6">
                {navItems.map((item) => (
                    <button onClick={() => onAction(item.actionId)} key={item.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.actionId === "home" && isActive('/tenant/dashboard') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto mb-8 space-y-3">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <h4 className="font-bold relative z-10">Need Help?</h4>
                    <p className="text-xs text-blue-100 mt-1 relative z-10 mb-3">Contact the caretaker directly.</p>
                    <button onClick={() => onAction("message_caretaker")} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-xs font-semibold transition-colors">Chat Now</button>
                </div>
                
                {/* Logout Button */}
                <LogoutButton />
            </div>
        </aside>
    );
};

const LogoutButton = () => {
    const router = useRouter();
    
    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        router.replace('/auth/login');
    };
    
    return (
        <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
        >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
        </button>
    );
};

export const TopBar = () => {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    
    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        router.replace('/auth/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
                <span className="font-bold text-xl tracking-tight hidden md:block">Arena Homes</span>
            </div>

            <div className="flex items-center gap-3">
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
                <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer md:hidden">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 overflow-hidden">
                        <User className="w-full h-full p-1 text-gray-400" />
                    </div>
                </div>
            </div>
        </header>
    );
};
