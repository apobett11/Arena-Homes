"use client";

import Link from "next/link";
import { Home, Twitter, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="bg-[#F5F1EB] text-[#4B5563] border-t border-[#C9B37F]/25">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-5 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-lg shadow-[#0F172A]/20 group-hover:scale-105 transition-transform">
                                <Home size={22} />
                            </div>
                            <span className="text-xl font-bold text-[#1F2937]">
                                Arena<span className="text-[#0F172A]">Homes</span>
                            </span>
                        </Link>
                        <p className="text-sm text-[#4B5563] leading-relaxed mb-6 max-w-xs">
                            The trusted platform for Egerton University student housing. Find verified, affordable rooms near campus.
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Instagram, Facebook].map((Icon, i) => (
                                <a 
                                    key={i} 
                                    href="#" 
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F8F5F0] text-[#4B5563] hover:bg-[#0F172A] hover:text-white transition-all border border-[#EDE9E0] hover:border-[#0F172A] shadow-sm hover:shadow-lg hover:shadow-[#0F172A]/10"
                                    aria-label={`Social link ${i + 1}`}
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[#1F2937] font-semibold text-sm mb-5 uppercase tracking-wider">For Students</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/listings" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Browse Houses</Link></li>
                            <li><Link href="/auth/login" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Login / Sign Up</Link></li>
                            <li><Link href="/tenant/dashboard" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Tenant Dashboard</Link></li>
                            <li><Link href="#" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">How It Works</Link></li>
                        </ul>
                    </div>

                    {/* For Staff */}
                    <div>
                        <h4 className="text-[#1F2937] font-semibold text-sm mb-5 uppercase tracking-wider">For Staff</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/caretaker/dashboard" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Caretaker Portal</Link></li>
                            <li><Link href="/admin/dashboard" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Admin Dashboard</Link></li>
                            <li><Link href="/accountant/dashboard" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Accountant Portal</Link></li>
                            <li><Link href="#" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">Support Center</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-[#1F2937] font-semibold text-sm mb-5 uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-[#0F172A] mt-0.5 shrink-0" />
                                <span className="text-[#4B5563]">Egerton University<br />Njoro, Kenya</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-[#0F172A] shrink-0" />
                                <a href="mailto:info@arenahomes.co.ke" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">
                                    info@arenahomes.co.ke
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-[#0F172A] shrink-0" />
                                <a href="tel:+254712345678" className="text-[#4B5563] hover:text-[#0F172A] transition-colors">
                                    +254 712 345 678
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[#EDE9E0]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#4B5563]">
                        <p>© {currentYear} Arena Homes. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="hover:text-[#0F172A] transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-[#0F172A] transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-[#0F172A] transition-colors">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
