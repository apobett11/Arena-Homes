"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const data = [3000, 4500, 3800, 5200, 4800, 6100, 5900, 7200, 6800, 8100, 7500, 9200];

export default function CashFlowChart() {
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        if (!pathRef.current) return;

        const length = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(pathRef.current, {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power2.inOut",
        });
    }, []);

    const width = 400;
    const height = 200;
    const padding = 20;
    const maxVal = Math.max(...data);

    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - (val / maxVal) * (height - padding * 2) - padding;
            return `${x},${y}`;
        })
        .join(" ");

    const d = `M ${points}`;

    return (
        <div className="h-64 w-full flex items-center justify-center">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0066FF" />
                        <stop offset="100%" stopColor="#00D084" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={(i / 4) * (height - padding * 2) + padding}
                        x2={width - padding}
                        y2={(i / 4) * (height - padding * 2) + padding}
                        stroke="#1e293b"
                        strokeWidth="1"
                    />
                ))}
                {/* The Line */}
                <path
                    ref={pathRef}
                    d={d}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Points */}
                {data.map((val, i) => (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1)) * (width - padding * 2) + padding}
                        cy={height - (val / maxVal) * (height - padding * 2) - padding}
                        r="4"
                        fill="#020617"
                        stroke="#00D084"
                        strokeWidth="2"
                        className="hover:r-6 transition-all cursor-pointer"
                    />
                ))}
            </svg>
        </div>
    );
}
