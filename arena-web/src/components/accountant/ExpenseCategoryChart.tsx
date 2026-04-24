"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const categories = [
    { name: "Maintenance", value: 35, color: "#0066FF" },
    { name: "Utilities", value: 25, color: "#00D084" },
    { name: "Staff Payroll", value: 20, color: "#F59E0B" },
    { name: "Emergency Fund", value: 15, color: "#6366f1" },
    { name: "Security", value: 5, color: "#EF4444" },
];

export default function ExpenseCategoryChart() {
    const barsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!barsRef.current) return;
        const bars = barsRef.current.querySelectorAll(".prog-bar");
        gsap.from(bars, {
            width: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power2.out",
        });
    }, []);

    return (
        <div ref={barsRef} className="space-y-4 py-2">
            {categories.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">{cat.name}</span>
                        <span className="text-slate-400 font-bold">{cat.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                            className="prog-bar h-full rounded-full transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                            style={{
                                width: `${cat.value}%`,
                                backgroundColor: cat.color,
                                boxShadow: `0 0 10px ${cat.color}40`,
                            }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
