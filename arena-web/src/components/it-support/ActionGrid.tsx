"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FileCode, Activity, Ticket, Users, Puzzle, Settings, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

export function ActionGrid() {
    const containerRef = useRef<HTMLDivElement>(null)

    const actions = [
        { icon: FileCode, label: "Monitor Logs", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
        { icon: Activity, label: "Run Diagnostics", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
        { icon: Ticket, label: "Support Queue", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
        { icon: Users, label: "Manage Accounts", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
        { icon: Puzzle, label: "Integrations", color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
        { icon: Settings, label: "Settings", color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" },
    ]

    useEffect(() => {
        if (!containerRef.current) return

        // Safety: Ensure visible if JS fails/lags
        gsap.set(".action-card", { visibility: "visible" })

        const ctx = gsap.context(() => {
            gsap.fromTo(".action-card",
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.05,
                    ease: "back.out(1.2)",
                    delay: 0.2 // Small delay to let layout settle
                }
            )
        }, containerRef)
        return () => ctx.revert()
    }, [])

    return (
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {actions.map((action, idx) => (
                <Card
                    key={idx}
                    className={cn(
                        "action-card group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/50 cursor-pointer border-white/5 bg-black/40 backdrop-blur-md",
                        action.border
                    )}
                >
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent")} />

                    <div className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[160px]">
                        <div className={cn("p-4 rounded-full mb-2 transition-transform duration-300 group-hover:rotate-12", action.bg, action.color)}>
                            <action.icon size={32} />
                        </div>
                        <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">{action.label}</h3>

                        <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight size={16} className={action.color} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
