'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { MobileNav, DesktopSidebar, TopBar } from '@/components/tenant/Navigation';
import TenantIdentityCard from '@/components/tenant/TenantIdentityCard';
import LiveMap from '@/components/tenant/LiveMap';
import ActionGrid from '@/components/tenant/ActionGrid';
import RecentActivity from '@/components/tenant/RecentActivity';
import PlotRules from '@/components/tenant/PlotRules';
import { TenantMeApi } from '@/lib/api/domains/tenant-profile';
import { IssueApi } from '@/lib/api/domains/issues';

export default function TenantDashboard() {
    const router = useRouter();
    const mainRef = useRef<HTMLDivElement>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Page load animation
        const ctx = gsap.context(() => {
            gsap.fromTo(mainRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
        });

        async function load() {
            try {
                // Fetch Auth Profile at least
                const me = await TenantMeApi.getProfile();
                setProfile({
                    name: me.user?.profile?.fullName || me.user?.email?.split('@')[0] || 'My Tenant',
                    plot: 'Njokerio Heights', // Mock since no lease/unit relation in basic auth info
                    room: 'A-101',
                    leaseStart: '2026-01-01',
                    leaseEnd: '2026-12-31'
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();

        return () => ctx.revert();
    }, []);

    const handleAction = (actionId: string) => {
        if (actionId === 'report' || actionId === 'community') {
            router.push('/tenant/chat');
            return;
        }
        router.push('/tenant/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-gray-100 font-sans pb-20 md:pb-0">
            <TopBar />
            <DesktopSidebar />
            <MobileNav />

            <main
                ref={mainRef}
                className="pt-20 px-4 md:px-8 md:ml-64 max-w-7xl mx-auto transition-all duration-300"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Top Section - Identity Card */}
                    <TenantIdentityCard
                        tenantName={profile?.name || "Loading..."}
                        plotName={profile?.plot || "..."}
                        roomNumber={profile?.room || "..."}
                        leaseStart={profile?.leaseStart || "..."}
                        leaseEnd={profile?.leaseEnd || "..."}
                        monthsPaid={loading ? 0 : 2} // Mock
                    />

                    {/* Live Map Module */}
                    <LiveMap />

                    {/* Action Grid */}
                    <h3 className="text-lg font-bold mb-4 px-1">Quick Actions</h3>
                    <ActionGrid onAction={handleAction} />

                    {/* Recent Activity */}
                    <RecentActivity />

                    {/* Plot Rules */}
                    <PlotRules />
                </div>
            </main>
        </div>
    );
}
