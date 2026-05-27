'use client';

import React from 'react';
import { Home, CreditCard, FileText, Settings, User, Bell, Moon, Sun, MessageSquare, Megaphone, Users, Star, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth';

interface TenantNavigationProps {
    onAction: (actionId: string) => void;
    unreadCount?: number;
    onOpenNotifications?: () => void;
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
        <aside className="hidden md:flex flex-col w-72 fixed top-0 bottom-0 left-0 bg-[#0d1628]/95 backdrop-blur-xl border-r border-[#1f2e48] z-40 pt-20 px-4">
            <div className="space-y-2 mt-6">
                {navItems.map((item) => (
                    <button onClick={() => onAction(item.actionId)} key={item.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.actionId === "home" && isActive('/tenant/dashboard') ? 'bg-gradient-to-r from-[#1d2e4a] to-[#16243b] text-[#f3f6fb] font-semibold shadow-[0_8px_24px_rgba(5,12,24,0.35)] border border-[#2e4263]' : 'text-[#a9b7cb] hover:bg-[#151f35] hover:text-[#e7edf8]'}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto mb-8 space-y-3">
                <div className="p-4 bg-gradient-to-br from-[#1d2f4d] via-[#16263f] to-[#111a2f] rounded-2xl text-white relative overflow-hidden group border border-[#304463] shadow-[0_14px_36px_rgba(8,15,31,0.35)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#f5c978]/20 rounded-full blur-2xl -mr-10 -mt-10" />
                    <h4 className="font-bold relative z-10">Need Help?</h4>
                    <p className="text-xs text-[#d6deeb] mt-1 relative z-10 mb-3">Contact the caretaker directly.</p>
                    <button onClick={() => onAction("message_caretaker")} className="w-full bg-[#f5c978]/15 hover:bg-[#f5c978]/25 border border-[#f5c978]/35 backdrop-blur-sm py-2 rounded-lg text-xs font-semibold transition-colors text-[#f8ddad]">Chat Now</button>
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
        router.replace('/');
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

export const TopBar = ({ unreadCount = 0, onOpenNotifications }: { unreadCount?: number; onOpenNotifications?: () => void }) => {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    
    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        router.replace('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0b1426]/85 backdrop-blur-xl border-b border-[#1d2d4a] z-50 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#1f3b62] to-[#0f1c33] border border-[#31507b] rounded-lg flex items-center justify-center text-[#f8ddad] font-bold text-xl">A</div>
                <span className="font-bold text-xl tracking-tight hidden md:block text-[#eef2fb]">Arena Homes</span>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-[#99a8c1] hover:bg-[#1a2741] rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={onOpenNotifications} className="p-2 text-[#99a8c1] hover:bg-[#1a2741] rounded-full transition-colors relative">
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#0b1426]"></span>}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/10 transition-colors"
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
