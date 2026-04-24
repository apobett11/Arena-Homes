"use client"

import React, { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, HardDrive, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

// --- System Performance Monitor ---
export function PerformanceMonitor() {
    const chartRef = useRef<HTMLDivElement>(null)

    const metrics = [
        { icon: Cpu, label: "CPU Usage", value: 34, max: 100, color: "text-blue-400", bgColor: "bg-blue-500", status: "optimal" },
        { icon: HardDrive, label: "Memory", value: 58, max: 100, color: "text-purple-400", bgColor: "bg-purple-500", status: "normal" },
        { icon: Zap, label: "Network I/O", value: 12, max: 100, color: "text-emerald-400", bgColor: "bg-emerald-500", status: "optimal" },
        { icon: TrendingUp, label: "Disk Usage", value: 67, max: 100, color: "text-orange-400", bgColor: "bg-orange-500", status: "normal" },
    ]

    useEffect(() => {
        if (!chartRef.current) return

        const ctx = gsap.context(() => {
            gsap.from(".perf-bar", {
                scaleX: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power2.out",
                transformOrigin: "left"
            })
        }, chartRef)

        return () => ctx.revert()
    }, [])

    return (
        <Card className="border-white/10 bg-black/20 h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Cpu className="w-5 h-5 text-[#0066FF]" /> System Performance
                </CardTitle>
            </CardHeader>
            <CardContent ref={chartRef} className="space-y-4">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <metric.icon className={cn("w-4 h-4", metric.color)} />
                                <span className="text-sm text-gray-300">{metric.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-white">{metric.value}%</span>
                                <Badge
                                    variant={metric.status === "optimal" ? "success" : "secondary"}
                                    className="text-[10px] px-1.5 py-0"
                                >
                                    {metric.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn("perf-bar h-full rounded-full transition-all duration-300", metric.bgColor)}
                                style={{ width: `${metric.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
