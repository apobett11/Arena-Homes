'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { User, MapPin, Calendar, CreditCard, MessageSquare, Home, Shield } from 'lucide-react';

interface CompactTenantCardProps {
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthsPaid: number;
  daysRemaining: number | null;
  caretakerName: string;
  caretakerPhone: string;
  caretakerStatus?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | null;
  avatarUrl?: string | null;
  onPayRent: () => void;
  onReportIssue: () => void;
  onMessageCaretaker: () => void;
}

const CompactTenantCard: React.FC<CompactTenantCardProps> = ({
  tenantName,
  propertyName,
  roomNumber,
  leaseStart,
  leaseEnd,
  monthsPaid,
  daysRemaining,
  caretakerName,
  caretakerPhone,
  caretakerStatus,
  avatarUrl,
  onPayRent,
  onReportIssue,
  onMessageCaretaker,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 15, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const getDaysColor = () => {
    if (daysRemaining === null) return 'text-gray-400 bg-gray-100/50 dark:bg-gray-800/50';
    if (daysRemaining > 14) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
    if (daysRemaining > 7) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
    return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Gradient Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{tenantName}</h2>
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Home size={12} />
                <span>{propertyName}</span>
                <span className="text-white/60">•</span>
                <span>Room {roomNumber}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onMessageCaretaker}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Message caretaker"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-700/50">
        <div className="bg-white dark:bg-slate-800/80 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Calendar size={12} />
            <span>Lease</span>
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {leaseStart} - {leaseEnd}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <CreditCard size={12} />
            <span>Paid</span>
          </div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {monthsPaid} months
          </p>
        </div>
        <div className={`px-3 py-2.5 text-center ${getDaysColor()}`}>
          <div className="flex items-center justify-center gap-1.5 text-xs opacity-80 mb-1">
            <Shield size={12} />
            <span>Due</span>
          </div>
          <p className="text-xs font-semibold">
            {daysRemaining === null ? 'N/A' : daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
          </p>
        </div>
      </div>

      {/* Caretaker & Actions */}
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <User size={14} className="text-slate-500" />
          </div>
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Caretaker:</span>
            <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{caretakerName}</span>
            {caretakerStatus && caretakerStatus !== 'ACTIVE' && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                {caretakerStatus}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onReportIssue}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
          >
            Report Issue
          </button>
          <button 
            onClick={onPayRent}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all"
          >
            Pay Rent
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompactTenantCard;
