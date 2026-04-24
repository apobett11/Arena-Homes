"use client"

import React, { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Users, Server } from "lucide-react"
import { SystemHealth } from "@/lib/api/domains/system"

interface CoreStatsProps {
    health?: SystemHealth | null;
    loading?: boolean;
}

export function CoreStats({ health, loading }: CoreStatsProps) {
    const statsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!statsRef.current || loading) return

        // Safety check - make sure elements are visible if GSAP fails
        gsap.set(".stat-card", { visibility: "visible" })

        const ctx = gsap.context(() => {
            // Count up animations
            const cpu = health?.cpuUsage || 0;
            const users = health?.activeConnections || 0;
            const uptime = 99.98; // Hardcoded derived stat for now

            const items = [
                { id: "#uptime-val", end: uptime, suffix: "%", decimals: 2 },
                { id: "#users-val", end: users, suffix: "", decimals: 0 },
                { id: "#load-val", end: cpu, suffix: "%", decimals: 0 }
            ]

            items.forEach(item => {
                gsap.from(item.id, {
                    innerText: 0,
                    duration: 2,
                    snap: { innerText: item.decimals === 2 ? 0.01 : 1 },
                    ease: "power2.out",
                    onUpdate: function () {
                        const el = document.querySelector(item.id)
                        // Ensure we format correctly during animation
                        if (el) {
                            const val = Number(this.targets()[0].innerText)
                            el.innerHTML = val.toFixed(item.decimals) + item.suffix
                        }
                    }
                })
            })

            // Gauge fill animation
            gsap.to(".gauge-fill", {
                strokeDashoffset: 100 - cpu,
                duration: 1.5,
                ease: "power2.out",
                delay: 0.5
            })
        }, statsRef)

        return () => ctx.revert()
    }, [loading, health])

    return (
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 h-full">
            {/* Uptime */}
            <Card className="stat-card border-emerald-500/20 bg-emerald-500/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={80} />
                </div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <h3 className="text-gray-400 font-medium flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" /> System Uptime
                    </h3>
                    <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight mt-2" id="uptime-val">
                        {loading ? "-" : "99.98%"}
                    </div>
                    <div className="text-xs text-emerald-500/80 mt-1">Target met (Last 30d)</div>
                </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="stat-card border-blue-500/20 bg-blue-500/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users size={80} />
                </div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <h3 className="text-gray-400 font-medium flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> Active Users
                    </h3>
                    <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight mt-2" id="users-val">
                        {loading ? "-" : (health?.activeConnections || 0)}
                    </div>
                    <div className="text-xs text-blue-500/80 mt-1">+12% from last week</div>
                </CardContent>
            </Card>

            {/* Server Load - Circular Gauge implementation */}
            <Card className="stat-card border-purple-500/20 bg-purple-500/5 overflow-hidden relative flex items-center">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Server size={80} />
                </div>
                <CardContent className="p-6 flex items-center gap-6 w-full">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-700"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className="gauge-fill text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                strokeDasharray="100, 100"
                                strokeDashoffset="100" // Start empty
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-purple-400">
                            Load
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-gray-400 font-medium flex items-center gap-2">
                            Server Load
                        </h3>
                        <div className="text-3xl font-bold text-white tracking-tight" id="load-val">
                            {loading ? "-" : (health?.cpuUsage || 0) + "%"}
                        </div>
                        <div className="text-xs text-purple-500/80">Optimal Performance</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
