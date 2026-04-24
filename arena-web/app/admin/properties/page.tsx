"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { PropertyApi, Property } from "@/lib/api/domains/properties";

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
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
        const data = await PropertyApi.getAll();
        setProperties(data);
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
                <p className="text-slate-400">Register houses with required logo + gate photos, caretaker onboarding, optional policies, and map pin details.</p>
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
                {serverMessage && <p className="mt-3 text-sm text-emerald-300">{serverMessage}</p>}
                <div className="mt-6 grid gap-2 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 md:p-6">
                    {properties.map((p) => (
                        <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                            <div className="font-semibold text-white">{p.name} - {p.location}</div>
                            {p.facilities?.invitePinCode && <div className="text-xs mt-1 text-emerald-300">Invite PIN: {p.facilities.invitePinCode}</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
