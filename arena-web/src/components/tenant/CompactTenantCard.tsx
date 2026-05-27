'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { User, Calendar, MessageSquare, Home } from 'lucide-react';

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

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-[26px] border border-[#2a3f61] bg-gradient-to-br from-[#172540] via-[#121d33] to-[#0f192d] shadow-[0_24px_60px_rgba(6,12,24,0.48)] transition-all duration-300"
    >
      <div className="absolute -right-20 -top-16 h-60 w-60 rounded-full bg-[#f5c978]/15 blur-3xl" />
      <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-[#3f89db]/10 blur-3xl" />
      <div className="relative px-5 py-5 md:px-7 md:py-6">
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/25">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                <User size={20} className="text-[#eff3fb]" />
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#f5c978]">Tenant Profile</p>
              <h2 className="text-lg md:text-xl font-semibold text-[#f7f9fe] mt-1">{tenantName}</h2>
              <div className="flex items-center gap-1 text-xs text-[#c4d0e3] mt-1">
                <Home size={12} />
                <span>{propertyName}</span>
                <span className="text-white/60">•</span>
                <span>Room {roomNumber}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onMessageCaretaker}
            className="p-2.5 rounded-xl bg-[#f5c978]/10 hover:bg-[#f5c978]/20 border border-[#f5c978]/30 transition-colors text-[#f8ddad]"
            title="Message caretaker"
          >
            <MessageSquare size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#324766] bg-[#112038]/75 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#9fb0c9] mb-1.5">
              <Calendar size={12} />
              <span>Lease Window</span>
            </div>
            <p className="text-sm font-medium text-[#ebf0fa]">
              {leaseStart} - {leaseEnd}
            </p>
          </div>
          <div className="rounded-2xl border border-[#324766] bg-[#112038]/75 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#9fb0c9] mb-1.5">Paid Months</div>
            <p className="text-sm font-medium text-[#f5c978]">{monthsPaid} month(s)</p>
          </div>
          <div className="rounded-2xl border border-[#324766] bg-[#112038]/75 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#9fb0c9] mb-1.5">Caretaker</div>
            <p className="text-sm font-medium text-[#ebf0fa]">{caretakerName}</p>
            {caretakerStatus && caretakerStatus !== 'ACTIVE' ? (
              <span className="inline-flex mt-2 rounded-full border border-rose-300/25 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
                {caretakerStatus}
              </span>
            ) : null}
            {caretakerPhone && caretakerPhone !== 'Not assigned yet' ? (
              <p className="text-xs text-[#9fb0c9] mt-1">{caretakerPhone}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-[#324766] bg-[#112038]/75 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#9fb0c9] mb-1.5">Lease Status</div>
            <p className="text-sm font-medium text-[#ebf0fa]">
              {daysRemaining === null ? 'Schedule pending' : daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Needs renewal'}
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button 
            onClick={onReportIssue}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#3c4f6e] bg-[#182640] hover:bg-[#20314f] text-[#d3dded] transition-all"
          >
            Report Issue
          </button>
          <button 
            onClick={onPayRent}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#2c5e9a] to-[#1f4673] text-[#f3f7ff] border border-[#4d76ab] shadow-[0_10px_20px_rgba(13,42,78,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Pay Rent
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompactTenantCard;
