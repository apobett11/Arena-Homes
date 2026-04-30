"use client";

import Link from "next/link";
import { Home, Twitter, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
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
        <footer className="bg-[#0F172A] text-slate-400 border-t border-blue-500/20">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                            >
                                <Home size={22} />
                            </motion.div>
                            <span className="text-xl font-bold text-white">
                                Arena<span className="text-blue-400">Homes</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-xs">
                            The trusted platform for Egerton University student housing. Find verified, affordable rooms near campus.
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Instagram, Facebook].map((Icon, i) => (
                                <motion.a 
                                    key={i} 
                                    href="#" 
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all border border-slate-700 hover:border-blue-500"
                                    aria-label={`Social link ${i + 1}`}
                                >
                                    <Icon size={18} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Grouped Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <ul className="space-y-2 text-sm">
                                {quickLinks.slice(0, 3).map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <ul className="space-y-2 text-sm">
                                {quickLinks.slice(3).map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <h4 className="text-white font-semibold text-sm mb-3 mt-6 uppercase tracking-wider">Staff Portal</h4>
                        <ul className="space-y-2 text-sm">
                            {staffLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-blue-400 mt-0.5 shrink-0" />
                                <span className="text-slate-400">Egerton University<br />Njoro, Kenya</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-blue-400 shrink-0" />
                                <a href="mailto:info@arenahomes.co.ke" className="text-slate-400 hover:text-blue-400 transition-colors">
                                    info@arenahomes.co.ke
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-blue-400 shrink-0" />
                                <a href="tel:+254712345678" className="text-slate-400 hover:text-blue-400 transition-colors">
                                    +254 712 345 678
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>© {currentYear} Arena Homes. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
