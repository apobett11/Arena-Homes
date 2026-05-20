"use client";

import Link from "next/link";
import { Home, Twitter, Instagram, Facebook, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    const quickLinks = [
        { label: "Browse Houses", href: "/listings" },
        { label: "Login / Sign Up", href: "/auth/login" },
        { label: "Tenant Dashboard", href: "/tenant/dashboard" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Rules", href: "#rules" },
        { label: "FAQs", href: "#faqs" },
    ];
    
    const staffLinks = [
        { label: "Caretaker Portal", href: "/caretaker/dashboard" },
        { label: "Admin Dashboard", href: "/admin/dashboard" },
        { label: "Accountant Portal", href: "/accountant/dashboard" },
    ];
    
    return (
        <footer className="border-t border-vibrant-blue/20 bg-surface-navy text-slate-400">
            {/* Main Footer - Compressed */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-vibrant-blue text-white shadow-lg shadow-vibrant-blue/30"
                            >
                                <Home size={18} />
                            </motion.div>
                            <span className="text-lg font-bold text-white">
                                Arena<span className="text-primary-fixed-dim">Homes</span>
                            </span>
                        </Link>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3 max-w-xs">
                            The trusted platform for Egerton University student housing.
                        </p>
                        <div className="flex gap-2">
                            {[Twitter, Instagram, Facebook].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-all hover:border-vibrant-blue hover:bg-vibrant-blue hover:text-white"
                                    aria-label={`Social link ${i + 1}`}
                                >
                                    <Icon size={14} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links - Side by side */}
                    <div className="lg:col-span-2">
                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                            <div>
                                <h4 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">Quick Links</h4>
                                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    {quickLinks.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="text-slate-400 hover:text-gold-accent transition-colors">
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">Staff Portal</h4>
                                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    {staffLinks.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="text-slate-400 hover:text-gold-accent transition-colors">
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">Contact</h4>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <li className="flex items-center gap-1">
                                <Mail size={12} className="shrink-0 text-vibrant-blue" />
                                <a href="mailto:info@arenahomes.co.ke" className="text-slate-400 hover:text-gold-accent transition-colors">
                                    info@arenahomes.co.ke
                                </a>
                            </li>
                            <li className="flex items-center gap-1">
                                <Phone size={12} className="shrink-0 text-vibrant-blue" />
                                <a href="tel:+254712345678" className="text-slate-400 hover:text-gold-accent transition-colors">
                                    +254 712 345 678
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                        <p>© {currentYear} Arena Homes. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="hover:text-gold-accent transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-gold-accent transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-gold-accent transition-colors">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
