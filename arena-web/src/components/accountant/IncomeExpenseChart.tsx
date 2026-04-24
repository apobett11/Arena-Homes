"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const data = [
    { month: "Jan", income: 45000, expenses: 32000 },
    { month: "Feb", income: 52000, expenses: 34000 },
    { month: "Mar", income: 48000, expenses: 31000 },
    { month: "Apr", income: 61000, expenses: 38000 },
    { month: "May", income: 55000, expenses: 36000 },
    { month: "Jun", income: 67000, expenses: 42000 },
];

export default function IncomeExpenseChart() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const bars = containerRef.current.querySelectorAll(".bar");
        gsap.from(bars, {
            scaleY: 0,
            duration: 1,
            stagger: 0.05,
            ease: "power3.out",
            transformOrigin: "bottom",
        });
    }, []);

    const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));

    return (
        <div ref={containerRef} className="h-64 flex items-end justify-between gap-4 pt-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="flex gap-1 w-full items-end h-[80%]">
                        {/* Income Bar */}
                        <div
                            className="bar flex-1 bg-[#0066FF] rounded-t-sm relative group/bar transition-all"
                            style={{ height: `${(d.income / maxVal) * 100}%` }}
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Income: ${d.income.toLocaleString()}
                            </div>
                        </div>
                        {/* Expense Bar */}
                        <div
                            className="bar flex-1 bg-red-500/80 rounded-t-sm relative group/bar transition-all"
                            style={{ height: `${(d.expenses / maxVal) * 100}%` }}
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Expense: ${d.expenses.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{d.month}</span>
                </div>
            ))}
        </div>
    );
}
