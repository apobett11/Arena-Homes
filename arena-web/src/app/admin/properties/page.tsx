"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { PropertyApi, Property } from "@/lib/api/domains/properties";
import { safeSelect } from "@/lib/supabase/safe";

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<"name" | "location" | "occupancy" | "caretaker">("name");
    const [showRegister, setShowRegister] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [houseGateImageUrl, setHouseGateImageUrl] = useState("");
    const [ownerType, setOwnerType] = useState("ARENA_HOMES");
    const [caretakerName, setCaretakerName] = useState("");
    const [caretakerPhone, setCaretakerPhone] = useState("");
    const [caretakerEmail, setCaretakerEmail] = useState("");
    const [houseCardDetails, setHouseCardDetails] = useState("");
    const [depositPolicy, setDepositPolicy] = useState("");
    const [holidayRentPolicy, setHolidayRentPolicy] = useState("");
    const [extraPolicies, setExtraPolicies] = useState("");
    const [gateLabel, setGateLabel] = useState("");
    const [plotLabel, setPlotLabel] = useState("");
    const [gateLat, setGateLat] = useState("");
    const [gateLng, setGateLng] = useState("");
    const [houseLat, setHouseLat] = useState("");
    const [houseLng, setHouseLng] = useState("");
    const [serverMessage, setServerMessage] = useState("");

    async function load() {
        const [propertyData, unitData] = await Promise.all([
            PropertyApi.getAll(),
            safeSelect<any>("units", (q) => q.select("*")),
        ]);
        setProperties(propertyData);
        setUnits(unitData);
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            load().catch(console.error);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    async function createProperty(e: React.FormEvent) {
        e.preventDefault();
        const policyList = [
            depositPolicy && `Deposit policy: ${depositPolicy}`,
            holidayRentPolicy && `Holiday rent policy: ${holidayRentPolicy}`,
            ...extraPolicies
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean),
        ].filter(Boolean) as string[];

        const response = await PropertyApi.create({
            name,
            location,
            logoUrl,
            facilities: {
                houseGateImageUrl,
                ownerType,
                caretakerName,
                caretakerPhone,
                caretakerEmail: caretakerEmail || undefined,
                houseCardDetails: houseCardDetails || undefined,
                policies: policyList.length ? policyList : undefined,
                map: {
                    gateLabel,
                    plotLabel,
                    gateLat: Number(gateLat),
                    gateLng: Number(gateLng),
                    houseLat: Number(houseLat),
                    houseLng: Number(houseLng),
                },
            },
        });

        setServerMessage(
            `Property created. Invite PIN: ${response.invitePinCode || "N/A"}${response.caretakerTempPassword ? ` | Caretaker temp password: ${response.caretakerTempPassword}` : ""}`
        );
        setName("");
        setLocation("");
        setLogoUrl("");
        setHouseGateImageUrl("");
        setCaretakerName("");
        setCaretakerPhone("");
        setCaretakerEmail("");
        setHouseCardDetails("");
        setDepositPolicy("");
        setHolidayRentPolicy("");
        setExtraPolicies("");
        setGateLabel("");
        setPlotLabel("");
        setGateLat("");
        setGateLng("");
        setHouseLat("");
        setHouseLng("");
        await load();
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">Property Registry</h1>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-slate-400">All properties and occupancy metrics in one table. Register property from the top button.</p>
                    <button
                        onClick={() => setShowRegister((prev) => !prev)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:scale-95 transition"
                    >
                        {showRegister ? "Hide Register Form" : "Register Property"}
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        ["name", "Name"],
                        ["location", "Location"],
                        ["occupancy", "Occupancy rate"],
                        ["caretaker", "Caretaker"],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key as any)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                sortBy === key
                                    ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                                    : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            Sort: {label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead className="bg-slate-900/90 text-slate-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Property name</th>
                                <th className="px-4 py-3 text-left">Owner / fulfilled by</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Occupancy rate</th>
                                <th className="px-4 py-3 text-left">Caretaker</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...properties]
                                .sort((a, b) => {
                                    const unitsA = units.filter((u) => u.property_id === a.id);
                                    const unitsB = units.filter((u) => u.property_id === b.id);
                                    const occupancyA = unitsA.length ? (unitsA.filter((u) => u.status === "TAKEN").length / unitsA.length) * 100 : 0;
                                    const occupancyB = unitsB.length ? (unitsB.filter((u) => u.status === "TAKEN").length / unitsB.length) * 100 : 0;
                                    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
                                    if (sortBy === "location") return (a.location || "").localeCompare(b.location || "");
                                    if (sortBy === "caretaker") return ((a as any).caretakerId || "").localeCompare((b as any).caretakerId || "");
                                    return occupancyB - occupancyA;
                                })
                                .map((property) => {
                                    const propertyUnits = units.filter((u) => u.property_id === property.id);
                                    const occupied = propertyUnits.filter((u) => u.status === "TAKEN").length;
                                    const occupancyRate = propertyUnits.length > 0 ? Math.round((occupied / propertyUnits.length) * 100) : 0;
                                    return (
                                        <tr key={property.id} className="border-t border-slate-800">
                                            <td className="px-4 py-3 font-semibold text-white">{property.name || "Unnamed"}</td>
                                            <td className="px-4 py-3 text-slate-300">{property.facilities?.ownerType || "ARENA_HOMES"}</td>
                                            <td className="px-4 py-3 text-slate-300">{property.location || "N/A"}</td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {propertyUnits.length > 0 ? `${occupancyRate}% (${occupied}/${propertyUnits.length})` : "0% / N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">{property.facilities?.caretakerName || "Unassigned"}</td>
                                            <td className="px-4 py-3">
                                                <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200">
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {showRegister && (
                <form onSubmit={createProperty} className="mt-6 grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/40 p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-white">Step 1: House Core Details (Required)</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="House name" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Location / alley" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} required placeholder="House logo image URL (listing image)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={houseGateImageUrl} onChange={(e) => setHouseGateImageUrl(e.target.value)} required placeholder="House gate image URL (required)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <select value={ownerType} onChange={(e) => setOwnerType(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                            <option value="ARENA_HOMES">Arena Homes</option>
                            <option value="OTHER">Other Owner</option>
                        </select>
                        <input value={houseCardDetails} onChange={(e) => setHouseCardDetails(e.target.value)} placeholder="House card details" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </div>

                    <h2 className="text-lg font-semibold text-white">Caretaker Setup (Dashboard Auto-Created)</h2>
                    <div className="grid gap-2 md:grid-cols-3">
                        <input value={caretakerName} onChange={(e) => setCaretakerName(e.target.value)} required placeholder="Caretaker full name" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={caretakerPhone} onChange={(e) => setCaretakerPhone(e.target.value)} required placeholder="Caretaker phone" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={caretakerEmail} onChange={(e) => setCaretakerEmail(e.target.value)} placeholder="Caretaker email (optional)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </div>

                    <h2 className="text-lg font-semibold text-white">Step 2: Policies (Optional)</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                        <input value={depositPolicy} onChange={(e) => setDepositPolicy(e.target.value)} placeholder="Deposit policy" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={holidayRentPolicy} onChange={(e) => setHolidayRentPolicy(e.target.value)} placeholder="Holiday rent payment policy" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </div>
                    <textarea value={extraPolicies} onChange={(e) => setExtraPolicies(e.target.value)} placeholder="Additional policies (one per line)" rows={3} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />

                    <h2 className="text-lg font-semibold text-white">Map Setup (Gate + Plot + House Pin)</h2>
                    <div className="grid gap-2 md:grid-cols-3">
                        <input value={gateLabel} onChange={(e) => setGateLabel(e.target.value)} required placeholder="Gate label (A/B/C...)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={plotLabel} onChange={(e) => setPlotLabel(e.target.value)} required placeholder="Plot label/number" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <div />
                        <input type="number" step="any" value={gateLat} onChange={(e) => setGateLat(e.target.value)} required placeholder="Gate latitude" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="number" step="any" value={gateLng} onChange={(e) => setGateLng(e.target.value)} required placeholder="Gate longitude" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="number" step="any" value={houseLat} onChange={(e) => setHouseLat(e.target.value)} required placeholder="House pin latitude" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="number" step="any" value={houseLng} onChange={(e) => setHouseLng(e.target.value)} required placeholder="House pin longitude" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </div>
                    <button className="w-fit rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Register House</button>
                </form>
                )}
                {serverMessage && <p className="mt-3 text-sm text-emerald-300">{serverMessage}</p>}
            </div>
        </div>
    );
}
