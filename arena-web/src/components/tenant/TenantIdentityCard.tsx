'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { User, MapPin, Calendar, CreditCard, MessageSquare } from 'lucide-react';

interface TenantIdentityCardProps {
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

const TenantIdentityCard: React.FC<TenantIdentityCardProps> = ({
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
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0 }
    );
  }, []);

  return (
    <div
      ref={cardRef}
      className="w-full relative overflow-hidden rounded-2xl glass p-6 mb-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border border-white/20 dark:border-white/10"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-electric/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Welcome, {tenantName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {propertyName} • {roomNumber}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full border border-white/20 overflow-hidden bg-slate-700/30 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Tenant avatar" className="h-full w-full object-cover" />
            ) : (
              <User size={24} className="text-gray-300" />
            )}
          </div>
        </div>

        {/* Lease Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
              <Calendar size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Lease</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {leaseStart} → {leaseEnd}
            </p>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Paid</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {monthsPaid} Months Ahead
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/50 p-4 text-sm">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Lease renews automatically after two months unless otherwise stated.
          </p>
          {daysRemaining !== null && (
            <div className={`mt-3 p-2.5 rounded-lg flex items-center gap-2 ${
              daysRemaining > 14 
                ? 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                : daysRemaining > 7 
                  ? 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-100/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
            }`}>
              <span className="font-semibold">
                {daysRemaining > 14 && '✓ '}
                {daysRemaining > 7 && daysRemaining <= 14 && '⚠ '}
                {daysRemaining <= 7 && '!'}
              </span>
              <span>
                {daysRemaining > 0 
                  ? `${daysRemaining} days until rent is due` 
                  : `Rent is ${Math.abs(daysRemaining)} days overdue`}
              </span>
            </div>
          )}
          {daysRemaining === null && (
            <p className="mt-2 text-slate-400">Days remaining: Not available yet</p>
          )}
          <div className="mt-3">
            <p className="text-slate-600 dark:text-slate-300">
              Caretaker: <span className="font-semibold text-slate-800 dark:text-slate-200">{caretakerName}</span>
              {caretakerStatus && caretakerStatus !== 'ACTIVE' && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  caretakerStatus === 'SUSPENDED'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {caretakerStatus}
                </span>
              )}
            </p>
            {caretakerPhone && caretakerPhone !== 'Not assigned yet' && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{caretakerPhone}</p>
            )}
            {caretakerStatus === 'SUSPENDED' && (
              <p className="mt-2 text-sm text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                ⚠ This caretaker is currently suspended. Contact admin support for assistance.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button onClick={onPayRent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
            Pay Rent
          </button>
          <button onClick={onReportIssue} className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 flex items-center justify-center gap-2">
            Report Issue
          </button>
          <button onClick={onMessageCaretaker} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-2.5 rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95" title="Message caretaker">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantIdentityCard;
