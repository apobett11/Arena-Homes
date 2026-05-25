"use client";

import Link from "next/link";
import { Home, Mail, Phone } from "lucide-react";

export const CaretakerFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="caretaker-footer mt-10 border-0">
      <div className="rounded-[20px] bg-gradient-to-br from-[#0a2540] via-[#0d3b66] to-[#1a4d7a] px-6 py-8 text-white shadow-[0_20px_48px_rgba(10,37,64,0.22)] md:px-10 md:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <div>
            <Link href="/caretaker/dashboard" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                <Home className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">
                Arena<span className="text-[#d4af37]">Homes</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-blue-100/80">
              Premium student housing operations — caretaker console for your assigned estate.
            </p>
          </div>

          <div>
            <p className="caretaker-label-caps text-blue-100/65">Console</p>
            <ul className="mt-3 space-y-2 text-sm font-medium text-blue-50/90">
              <li>
                <Link href="/caretaker/dashboard" className="hover:text-[#d4af37] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/caretaker/units" className="hover:text-[#d4af37] transition-colors">
                  Units
                </Link>
              </li>
              <li>
                <Link href="/caretaker/tenants" className="hover:text-[#d4af37] transition-colors">
                  Tenants
                </Link>
              </li>
              <li>
                <Link href="/caretaker/messages" className="hover:text-[#d4af37] transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="caretaker-label-caps text-blue-100/65">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/85">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[#d4af37]" />
                support@arenahomes.co.ke
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#d4af37]" />
                Contact your property admin
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/12 pt-6 text-xs text-blue-100/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Arena Homes. All rights reserved.</p>
          <p className="text-[#d4af37]/90 font-semibold">Luxury property management</p>
        </div>
      </div>
    </footer>
  );
};
