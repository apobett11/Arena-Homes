"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, Home, LogOut, User, Phone, Mail, MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { AuthApi } from "@/lib/api/auth";
import { useRouter, usePathname } from "next/navigation";
import { getHomeRouteForRole, getCurrentUserRoleProfile } from "@/lib/auth/role-routing";
import { safeMaybeSingle } from "@/lib/supabase/safe";
import { getSupabaseClient } from "@/lib/supabase/client";

// Contact Us Button Component
function ContactUsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState<{ email?: string; phone?: string; address?: string }>({});

    useEffect(() => {
        async function loadContactInfo() {
            try {
                const supabase = getSupabaseClient();
                const { data } = await supabase
                    .from('site_settings')
                    .select('contact_email, contact_phone, contact_address')
                    .eq('id', 'default')
                    .maybeSingle();
                if (data) {
                    const settings = data as { contact_email?: string; contact_phone?: string; contact_address?: string };
                    setContactInfo({
                        email: settings.contact_email,
                        phone: settings.contact_phone,
                        address: settings.contact_address,
                    });
                }
            } catch {
                setContactInfo({
                    email: 'info@arenahomes.co.ke',
                    phone: '+254 712 345 678',
                    address: 'Egerton University, Njoro',
                });
            }
        }
        if (isOpen) {
            void loadContactInfo();
        }
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-xl bg-vibrant-blue px-4 py-2 text-sm font-semibold leading-none text-white transition-all hover:scale-105 hover:bg-primary-marketing active:scale-95 md:px-6 md:py-3"
            >
                Contact Us
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black/50 border border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Contact Us</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {contactInfo.email && (
                                    <a
                                        href={`mailto:${contactInfo.email}`}
                                        className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Mail size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Email</p>
                                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{contactInfo.email}</p>
                                        </div>
                                    </a>
                                )}
                                {contactInfo.phone && (
                                    <a
                                        href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                                        className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <Phone size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Phone</p>
                                            <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">{contactInfo.phone}</p>
                                        </div>
                                    </a>
                                )}
                                {contactInfo.address && (
                                    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                            <MapPin size={20} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Address</p>
                                            <p className="text-white font-medium">{contactInfo.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Mobile Contact Button Component
function MobileContactButton({ setMobileMenuOpen }: { setMobileMenuOpen: (open: boolean) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState<{ email?: string; phone?: string; address?: string }>({});

    useEffect(() => {
        async function loadContactInfo() {
            try {
                const supabase = getSupabaseClient();
                const { data } = await supabase
                    .from('site_settings')
                    .select('contact_email, contact_phone, contact_address')
                    .eq('id', 'default')
                    .maybeSingle();
                if (data) {
                    const settings = data as { contact_email?: string; contact_phone?: string; contact_address?: string };
                    setContactInfo({
                        email: settings.contact_email,
                        phone: settings.contact_phone,
                        address: settings.contact_address,
                    });
                }
            } catch {
                setContactInfo({
                    email: 'info@arenahomes.co.ke',
                    phone: '+254 712 345 678',
                    address: 'Egerton University, Njoro',
                });
            }
        }
        if (isOpen) {
            void loadContactInfo();
        }
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => setIsOpen(true), 300);
                }}
                className="block w-full text-left text-base font-medium text-white/70 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all"
            >
                Contact Us
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black/50 border border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Contact Us</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {contactInfo.email && (
                                    <a
                                        href={`mailto:${contactInfo.email}`}
                                        className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Mail size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Email</p>
                                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{contactInfo.email}</p>
                                        </div>
                                    </a>
                                )}
                                {contactInfo.phone && (
                                    <a
                                        href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                                        className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <Phone size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Phone</p>
                                            <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">{contactInfo.phone}</p>
                                        </div>
                                    </a>
                                )}
                                {contactInfo.address && (
                                    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                                        <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                            <MapPin size={20} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Address</p>
                                            <p className="text-white font-medium">{contactInfo.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

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
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const hydrateRole = async () => {
            const result = await getCurrentUserRoleProfile();
            if (!result.ok) {
                setRole(null);
                setDashboardRoute("/auth/login");
                return;
            }
            setRole(result.role);
            setDashboardRoute(getHomeRouteForRole(result.role) ?? "/auth/login");
        };
        const hydrateBrand = async () => {
            const site = await safeMaybeSingle<any>("site_settings", (q) =>
                q.select("*").eq("id", "default").maybeSingle()
            );
            if (site) {
                setBrandName(site.site_name || "ArenaHomes");
                setBrandLogo(site.logo_url || "");
                return;
            }
            const fallback = await safeMaybeSingle<any>("app_settings", (q) =>
                q.select("*").eq("key", "site_brand").maybeSingle()
            );
            const value = fallback?.value || {};
            setBrandName(value.site_name || "ArenaHomes");
            setBrandLogo(value.logo_url || "");
        };
        void hydrateRole();
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
        { name: "Home", href: "/" },
        { name: "Browse Houses", href: "/listings" },
        { name: "About Us", href: "#how-it-works" },
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
            className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-black/80 py-4 backdrop-blur-xl transition-all duration-300 px-4 md:px-10"
        >
            <div className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    {brandLogo ? (
                        <img
                            src={brandLogo}
                            alt="Brand logo"
                            className="h-8 w-auto object-contain md:h-10"
                        />
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-vibrant-blue text-white shadow-lg shadow-vibrant-blue/30 md:h-10 md:w-10"
                        >
                            <Home size={22} />
                        </motion.div>
                    )}
                    <span className="text-xl font-bold tracking-tight text-white md:text-2xl">{brandName}</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-10 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
                                isActive(link.href)
                                    ? "text-primary-fixed-dim"
                                    : "text-outline-variant hover:text-gold-accent"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <ContactUsButton />

                    <div className="ml-2 flex items-center gap-4 border-l border-white/10 pl-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="hidden rounded-full p-2 text-primary-fixed-dim transition-colors hover:bg-white/10 md:block"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </motion.button>

                        {role ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={dashboardRoute}
                                    className="flex items-center gap-2 rounded-xl border border-vibrant-blue/30 bg-vibrant-blue/15 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-vibrant-blue/25"
                                >
                                    <User size={16} /> Dashboard
                                </Link>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-2.5 text-rose-300 hover:bg-rose-500/30"
                                    aria-label="Sign out"
                                >
                                    <LogOut size={16} />
                                </motion.button>
                            </div>
                        ) : (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link
                                    href="/auth/login"
                                    className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-gold-accent"
                                >
                                    <User size={16} />
                                    Login
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Mobile: theme + menu */}
                <div className="flex items-center gap-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-primary-fixed-dim transition-colors hover:bg-white/10"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex h-10 w-10 items-center justify-center text-white"
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
                        className="border-t border-white/10 bg-[#0F172A]/98 backdrop-blur-xl lg:hidden"
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
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: navLinks.length * 0.1 }}
                            >
                                <MobileContactButton setMobileMenuOpen={setMobileMenuOpen} />
                            </motion.div>
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
}
