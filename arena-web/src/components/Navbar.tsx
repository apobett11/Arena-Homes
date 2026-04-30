"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Home, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { AuthApi } from "@/lib/api/auth";
import { useRouter, usePathname } from "next/navigation";
import { getHomeRouteForRole, getCurrentUserRoleProfile } from "@/lib/auth/role-routing";
import { safeMaybeSingle } from "@/lib/supabase/safe";

export const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [dashboardRoute, setDashboardRoute] = useState<string>("/auth/login");
    const [brandName, setBrandName] = useState("ArenaHomes");
    const [brandLogo, setBrandLogo] = useState<string>("");
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);

        const hydrateRole = async () => {
            const result = await getCurrentUserRoleProfile();
            if (!result.ok) {
                setRole(null);
                setDashboardRoute('/auth/login');
                return;
            }
            setRole(result.role);
            setDashboardRoute(getHomeRouteForRole(result.role) ?? '/auth/login');
        };
        void hydrateRole();
        const hydrateBrand = async () => {
            const site = await safeMaybeSingle<any>("site_settings", (q) => q.select("*").eq("id", "default").maybeSingle());
            if (site) {
                setBrandName(site.site_name || "ArenaHomes");
                setBrandLogo(site.logo_url || "");
                return;
            }
            const fallback = await safeMaybeSingle<any>("app_settings", (q) => q.select("*").eq("key", "site_brand").maybeSingle());
            const value = fallback?.value || {};
            setBrandName(value.site_name || "ArenaHomes");
            setBrandLogo(value.logo_url || "");
        };
        void hydrateBrand();
    }, []);

    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');
        setRole(null);
        setDashboardRoute('/auth/login');
        router.replace('/');
    };

    if (!mounted) return null;

    const navLinks = [
        { name: "Browse Houses", href: "/listings" },
        { name: "How It Works", href: "#how-it-works" },
        { name: "Rules", href: "#rules" },
        { name: "FAQs", href: "#faqs" },
    ];

    const isActive = (href: string) => {
        if (href.startsWith('#')) return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`fixed top-0 z-50 w-full py-3 transition-all duration-300 ${isScrolled ? 'bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-black/20' : 'bg-transparent'}`}
        >
            {/* Subtle animated background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute top-0 right-1/4 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '-4s' }} />
            </div>

            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10">
                <Link href="/" className="flex items-center gap-2.5 group">
                    {brandLogo ? (
                        <img src={brandLogo} alt="Brand logo" className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-blue-500/20" />
                    ) : (
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        >
                            <Home size={22} />
                        </motion.div>
                    )}
                    <span className="text-xl md:text-2xl font-bold tracking-tight text-white">
                        {brandName}
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-1 lg:gap-2 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`nav-link text-sm font-medium px-4 py-2 text-white/80 hover:text-white transition-all ${isActive(link.href) ? 'active text-white' : ''}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    
                    <div className="flex items-center gap-2 pl-4 ml-2 border-l border-white/20">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </motion.button>

                        {role ? (
                            <div className="flex gap-2">
                                <Link href={dashboardRoute} className="flex items-center gap-2 rounded-xl bg-blue-600/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600/30 transition-all border border-blue-500/30">
                                    <User size={16} /> Dashboard
                                </Link>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout} 
                                    className="flex items-center justify-center rounded-xl bg-rose-500/20 px-3 py-2.5 text-rose-300 hover:bg-rose-500/30 transition-all border border-rose-500/30" 
                                    aria-label="Sign out"
                                >
                                    <LogOut size={16} />
                                </motion.button>
                            </div>
                        ) : (
                            <>
                                <Link href="/listings" className="hidden lg:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white transition-all">
                                    Browse Houses
                                </Link>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link href="/auth/login" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/25">
                                        <User size={16} />
                                        Login
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-3 md:hidden pr-2">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white/80 hover:text-white transition-all"
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 transition-all mr-2"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/10 bg-[#0F172A]/98 backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col gap-2 p-4">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-base font-medium text-white/70 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all"
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="pt-4 border-t border-white/10 mt-2">
                                {role ? (
                                    <div className="flex flex-col gap-2">
                                        <Link href={dashboardRoute} className="w-full text-center rounded-xl bg-blue-600/20 py-3 text-base font-semibold text-white border border-blue-500/30">
                                            Dashboard
                                        </Link>
                                        <button onClick={handleLogout} className="w-full rounded-xl bg-rose-500/20 py-3 text-base font-semibold text-rose-300 border border-rose-500/30">
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <Link href="/auth/login" className="block w-full text-center rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25">
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
