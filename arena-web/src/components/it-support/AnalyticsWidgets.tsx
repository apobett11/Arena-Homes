"use client"

import React, { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Save, Cloud, RotateCcw, ShieldAlert, Lock, Globe } from "lucide-react"

// --- Search Analytics Widget ---
export function SearchAnalytics() {
    const graphRef = useRef<HTMLDivElement>(null)

    // ... exact content from previous step ...
    const data = [
        { term: "Njokerio", count: 85, color: "bg-blue-500" },
        { term: "1 Bedroom", count: 62, color: "bg-purple-500" },
        { term: "Main Gate", count: 45, color: "bg-emerald-500" },
        { term: "WiFi", count: 38, color: "bg-orange-500" },
        { term: "Self-contained", count: 25, color: "bg-pink-500" },
    ]

    useEffect(() => {
        if (!graphRef.current) return

        const ctx = gsap.context(() => {
            gsap.from(".bar-fill", {
                scaleX: 0,
                duration: 1.5,
                stagger: 0.1,
                ease: "power3.out",
                transformOrigin: "left"
            })
        }, graphRef)

        return () => ctx.revert()
    }, [])

    return (
        <Card className="border-white/10 bg-black/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#0066FF]" /> Search Trends
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" ref={graphRef}>
                {data.map((item, i) => (
                    <div key={item.term} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{item.term}</span>
                            <span>{item.count} hits</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`bar-fill h-full rounded-full ${item.color}`}
                                style={{ width: `${item.count}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

// --- Security & Backup Nexus ---
export function SecurityNexus() {
    return (
        <Card className="border-red-900/20 bg-gradient-to-br from-black/40 to-red-900/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-20">
                <ShieldAlert className="w-24 h-24 text-red-500" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-100">
                    <ShieldAlert className="w-5 h-5 text-red-500" /> Security Sentinel
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
                {/* Visual Threat Level */}
                <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-500 tracking-wider">Threat Level</span>
                        <span className="text-xl font-bold text-emerald-400">LOW</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2 h-6 bg-emerald-500 rounded-sm animate-pulse" />
                        <div className="w-2 h-6 bg-emerald-900/50 rounded-sm" />
                        <div className="w-2 h-6 bg-emerald-900/50 rounded-sm" />
                    </div>
                </div>

                {/* Live Auth Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs">
                            <Lock size={12} /> Auth Fails
                        </div>
                        <div className="text-lg font-mono text-white">0</div>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs">
                            <Globe size={12} /> Blocked IPs
                        </div>
                        <div className="text-lg font-mono text-red-400">2</div>
                    </div>
                </div>

                {/* Integrated Backup Controls */}
                <div className="pt-2 border-t border-white/10">
                    <h4 className="text-[10px] uppercase text-gray-500 mb-3 tracking-wider">System Recovery</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Button size="sm" variant="outline" className="h-8 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
                            <Cloud className="w-3 h-3 mr-2" /> Backup
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 text-gray-400 hover:text-white hover:bg-white/10">
                            <RotateCcw className="w-3 h-3 mr-2" /> Restore
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
