"use client"

import React, { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

export function HealthHeatmap() {
    const gridRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes] = React.useState<Array<{ id: number, status: string }>>([])

    // Generate nodes only on client to avoid hydration mismatch
    useEffect(() => {
        const newNodes = Array.from({ length: 48 }, (_, i) => ({
            id: i,
            status: Math.random() > 0.9 ? "warning" : Math.random() > 0.98 ? "error" : "healthy",
        }))
        setNodes(newNodes)
    }, [])

    useEffect(() => {
        if (!gridRef.current || nodes.length === 0) return

        const ctx = gsap.context(() => {
            // Pulse animation for healthy nodes
            gsap.to(".node-healthy", {
                opacity: 0.6,
                duration: "random(1.5, 3)",
                repeat: -1,
                yoyo: true,
                stagger: {
                    amount: 2,
                    from: "random"
                }
            })

            // Warning nodes flash faster
            gsap.to(".node-warning", {
                opacity: 0.4,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            })

            // Error nodes heavy pulse
            gsap.to(".node-error", {
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)",
                duration: 0.8,
                repeat: -1,
                yoyo: true
            })

            // Initial entrance - simple fade in to avoid sticking
            gsap.fromTo(".heatmap-node",
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, stagger: 0.01, ease: "back.out(1.5)" }
            )
        }, gridRef)

        return () => ctx.revert()
    }, [nodes])

    return (
        <div ref={gridRef} className="w-full h-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex flex-col gap-2 min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-widest">System Architecture Map</h3>
                <div className="flex gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> HEALTHY</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> WARN</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> CRIT</span>
                </div>
            </div>
            <div className="grid grid-cols-8 md:grid-cols-12 gap-2 h-full content-start text-white">
                {nodes.length === 0 ? (
                    <div className="col-span-12 text-center text-xs text-gray-500 py-10">Initializing grid...</div>
                ) : (
                    nodes.map((node) => (
                        <div
                            key={node.id}
                            className={cn(
                                "heatmap-node aspect-square rounded-sm border transition-colors duration-500",
                                node.status === "healthy" && "node-healthy bg-emerald-500/20 border-emerald-500/30",
                                node.status === "warning" && "node-warning bg-yellow-500/20 border-yellow-500/30",
                                node.status === "error" && "node-error bg-red-500/40 border-red-500/60"
                            )}
                            title={`Node ${node.id} - ${node.status.toUpperCase()}`}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
