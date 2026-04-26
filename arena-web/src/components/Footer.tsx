"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Twitter, Instagram, Facebook, Mail, MapPin, Phone, LogOut } from "lucide-react";
import { AuthApi } from "@/lib/api/auth";

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const router = useRouter();
    
    const handleLogout = async () => {
        await AuthApi.logout();
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        router.replace('/auth/login');
    };
    
    return (
        <footer className="bg-slate-900 text-slate-300">
            {/* Main Footer */}
            <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-3 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-premium text-white shadow-lg group-hover:scale-105 transition-transform">
                                <Home size={20} />
                            </div>
                            <span className="text-lg font-bold text-white">
                                Arena<span className="text-primary">Homes</span>
                            </span>
                        </Link>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-xs">
                            Premium student housing for Egerton University. Find verified, affordable rooms near campus.
                        </p>
                        <div className="flex gap-2">
                            {[Twitter, Instagram, Facebook].map((Icon, i) => (
                                <Link 
                                    key={i} 
                                    href="#" 
                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all"
                                >
                                    <Icon size={16} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links - 2 Column Grid */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/listings" className="text-slate-400 hover:text-primary transition-colors">Browse Houses</Link></li>
                                <li><Link href="/auth/login" className="text-slate-400 hover:text-primary transition-colors">Login</Link></li>
                                <li><Link href="/tenant/dashboard" className="text-slate-400 hover:text-primary transition-colors">Tenant Portal</Link></li>
                                <li><Link href="/caretaker/dashboard" className="text-slate-400 hover:text-primary transition-colors">Caretaker</Link></li>
                            </ul>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/admin/dashboard" className="text-slate-400 hover:text-primary transition-colors">Admin</Link></li>
                                <li><Link href="/accountant/dashboard" className="text-slate-400 hover:text-primary transition-colors">Accountant</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-primary transition-colors">Support</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-primary transition-colors">FAQs</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
                        <ul className="space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                                <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                <span className="text-slate-400">Egerton University, Njoro</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail size={14} className="text-primary shrink-0" />
                                <a href="mailto:info@arenahomes.co.ke" className="text-slate-400 hover:text-primary transition-colors">
                                    info@arenahomes.co.ke
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={14} className="text-primary shrink-0" />
                                <a href="tel:+254712345678" className="text-slate-400 hover:text-primary transition-colors">
                                    +254 712 345 678
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
                <div className="container mx-auto px-4 md:px-6 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                        <p>© {currentYear} Arena Homes. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                            >
                                <LogOut size={12} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
