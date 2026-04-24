'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { User, MapPin, Calendar, CreditCard, ChevronRight } from 'lucide-react';

interface TenantIdentityCardProps {
  tenantName: string;
  plotName: string;
  roomNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthsPaid: number;
}

const TenantIdentityCard: React.FC<TenantIdentityCardProps> = ({
  tenantName,
  plotName,
  roomNumber,
  leaseStart,
  leaseEnd,
  monthsPaid,
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
              {plotName} • {roomNumber}
            </p>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="relative">
              <User size={24} className="text-gray-700 dark:text-gray-300" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            </div>
          </button>
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

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
            Pay Rent
          </button>
          <button className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 flex items-center justify-center gap-2">
            Report
          </button>
          <button className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-2.5 rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantIdentityCard;
