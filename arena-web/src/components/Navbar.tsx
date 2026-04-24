"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Home, LogOut, User, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { logoutAction } from "@/app/auth/actions";

export const Navbar = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);

        // Simple cookie check for UI (not security)
        const match = document.cookie.match(/(^|;)\s*user_role\s*=\s*([^;]+)/);
        if (match) {
            setRole(match[2]);
        }

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        await logoutAction();
    };

    if (!mounted) return null;

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Listings", href: "/listings" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <nav
            className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled
                ? "bg-white/95 dark:bg-slate-950/95 py-3 shadow-lg border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl"
                : "bg-transparent py-5"
                }`}
        >
            <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-premium text-white shadow-lg group-hover:scale-105 transition-transform">
                        <Home size={22} />
                    </div>
                    <span className={`text-xl md:text-2xl font-bold tracking-tight transition-colors duration-300 ${isScrolled ? "text-slate-900 dark:text-white" : "text-white"}`}>
                        Arena<span className="text-primary">Homes</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-6 lg:gap-8 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-medium transition-all hover:text-primary px-3 py-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${isScrolled ? "text-slate-600 dark:text-slate-300" : "text-white/90 hover:text-white"}
                            `}>
                            {link.name}
                        </Link>
                    ))}
                    
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50 dark:border-slate-700/50">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isScrolled ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {role ? (
                            <div className="flex gap-2">
                                <Link href="/auth/login" className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                    <User size={16} /> Dashboard
                                </Link>
                                <button onClick={handleLogout} className="flex items-center justify-center rounded-xl bg-red-50 px-3 py-2.5 text-red-600 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <Link href="/auth/login" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                                <User size={16} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>


                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-3 md:hidden">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isScrolled ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600" : "border-white/20 bg-white/10 text-white"}`}
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isScrolled ? "text-slate-900" : "text-white"}`}
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
                        className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col gap-2 p-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-base font-medium text-slate-700 dark:text-slate-300 transition-colors hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 rounded-xl"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 mt-2">
                                {role ? (
                                    <div className="flex flex-col gap-2">
                                        <Link href="/auth/login" className="w-full text-center rounded-xl bg-primary/10 py-3 text-base font-semibold text-primary dark:bg-primary/20">
                                            Dashboard
                                        </Link>
                                        <button onClick={handleLogout} className="w-full rounded-xl bg-red-50 py-3 text-base font-semibold text-red-600 dark:bg-red-900/20">
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <Link href="/auth/login" className="block w-full text-center rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg shadow-primary/20">
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
