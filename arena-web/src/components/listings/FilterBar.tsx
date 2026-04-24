"use client";

import { useState, useEffect, useRef } from "react";
import { Filter, X, ChevronDown, ArrowUp, ArrowDown, MapPin, Home, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
    priceRange: [number, number];
    locations: string[];
    houseTypes: string[];
    sortDirection: 'asc' | 'desc';
}

interface FilterBarProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    minPrice: number;
    maxPrice: number;
    availableLocations: string[];
    availableTypes: string[];
}

export const FilterBar = ({
    filters,
    setFilters,
    minPrice,
    maxPrice,
    availableLocations,
    availableTypes
}: FilterBarProps) => {
    const [isSticky, setIsSticky] = useState(false);

    // Sticky header logic
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handlers
    const updatePrice = (index: 0 | 1, value: number) => {
        const newRange: [number, number] = [...filters.priceRange];
        newRange[index] = value;
        setFilters({ ...filters, priceRange: newRange });
    };

    const toggleLocation = (loc: string) => {
        const current = filters.locations;
        const newLocs = current.includes(loc)
            ? current.filter(l => l !== loc)
            : [...current, loc];
        setFilters({ ...filters, locations: newLocs });
    };

    const toggleType = (type: string) => {
        const current = filters.houseTypes;
        const newTypes = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        setFilters({ ...filters, houseTypes: newTypes });
    };

    const toggleSort = () => {
        setFilters({
            ...filters,
            sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
        });
    };

    return (
        <div className={cn(
            "w-full z-40 transition-all duration-300 border-b border-slate-200 dark:border-white/10",
            isSticky ? "fixed top-16 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg" : "relative bg-white dark:bg-zinc-950"
        )}>
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">

                    {/* Filters Group */}
                    <div className="flex flex-wrap items-center gap-3">

                        {/* Price Filter */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#0066FF] transition-all text-sm font-semibold">
                                <DollarSign size={14} className="text-[#0066FF]" />
                                <span>Price</span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            {/* Dropdown Content */}
                            <div className="hidden group-hover:block hover:block absolute top-full left-0 mt-2 p-4 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm">Price Range (KES)</h4>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={filters.priceRange[0]}
                                            onChange={(e) => updatePrice(0, Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="number"
                                            value={filters.priceRange[1]}
                                            onChange={(e) => updatePrice(1, Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm"
                                        />
                                    </div>
                                    <div className="relative h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 bottom-0 bg-[#0066FF]"
                                            style={{
                                                left: `${((filters.priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                                                right: `${100 - ((filters.priceRange[1] - minPrice) / (maxPrice - minPrice)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                        <span>{minPrice}</span>
                                        <span>{maxPrice}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Filter */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#0066FF] transition-all text-sm font-semibold">
                                <MapPin size={14} className="text-[#0066FF]" />
                                <span>Location</span>
                                {filters.locations.length > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0066FF] text-white text-[10px]">{filters.locations.length}</span>
                                )}
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            <div className="hidden group-hover:block hover:block absolute top-full left-0 mt-2 p-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50">
                                <div className="max-h-60 overflow-y-auto space-y-1 p-1">
                                    {availableLocations.map(loc => (
                                        <div
                                            key={loc}
                                            onClick={() => toggleLocation(loc)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors",
                                                filters.locations.includes(loc)
                                                    ? "bg-[#0066FF]/10 text-[#0066FF]"
                                                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                filters.locations.includes(loc) ? "bg-[#0066FF] border-[#0066FF]" : "border-slate-300 dark:border-white/20"
                                            )}>
                                                {filters.locations.includes(loc) && <Filter size={10} className="text-white" />}
                                            </div>
                                            {loc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#0066FF] transition-all text-sm font-semibold">
                                <Home size={14} className="text-[#0066FF]" />
                                <span>Type</span>
                                {filters.houseTypes.length > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0066FF] text-white text-[10px]">{filters.houseTypes.length}</span>
                                )}
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            <div className="hidden group-hover:block hover:block absolute top-full left-0 mt-2 p-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50">
                                <div className="space-y-1 p-1">
                                    {availableTypes.map(type => (
                                        <div
                                            key={type}
                                            onClick={() => toggleType(type)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors",
                                                filters.houseTypes.includes(type)
                                                    ? "bg-[#0066FF]/10 text-[#0066FF]"
                                                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                filters.houseTypes.includes(type) ? "bg-[#0066FF] border-[#0066FF]" : "border-slate-300 dark:border-white/20"
                                            )}>
                                                {filters.houseTypes.includes(type) && <Filter size={10} className="text-white" />}
                                            </div>
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sort Control */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSort}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm font-semibold text-slate-600 dark:text-slate-300"
                        >
                            <span className="text-xs uppercase tracking-wider text-slate-400">Sort</span>
                            {filters.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            Price
                        </button>
                    </div>

                </div>

                {/* Active Filters Summary (Chips) */}
                {(filters.locations.length > 0 || filters.houseTypes.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-center mr-2">Filters:</span>

                        {filters.locations.map(loc => (
                            <button key={loc} onClick={() => toggleLocation(loc)} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-bold hover:bg-[#0066FF]/20 transition-colors">
                                {loc} <X size={10} />
                            </button>
                        ))}
                        {filters.houseTypes.map(type => (
                            <button key={type} onClick={() => toggleType(type)} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D084]/10 text-[#00D084] text-xs font-bold hover:bg-[#00D084]/20 transition-colors">
                                {type} <X size={10} />
                            </button>
                        ))}

                        <button
                            onClick={() => setFilters({ ...filters, locations: [], houseTypes: [], priceRange: [minPrice, maxPrice] })}
                            className="text-xs font-bold text-slate-400 hover:text-red-500 ml-auto transition-colors"
                        >
                            Reset All
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
