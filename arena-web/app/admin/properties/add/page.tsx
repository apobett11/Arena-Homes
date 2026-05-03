"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, Plus, Trash2, Home, User, HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

type StepType = "basic" | "details" | "caretaker" | "faq";

const STEPS: { id: StepType; label: string; number: number }[] = [
    { id: "basic", label: "Basic Info", number: 1 },
    { id: "details", label: "Details", number: 2 },
    { id: "caretaker", label: "Caretaker", number: 3 },
    { id: "faq", label: "FAQ & Rules", number: 4 },
];

const PROPERTY_TYPES = ["Bedsitter", "Single Room", "One Bedroom", "Two Bedroom"];
const ELECTRICITY_OPTIONS = ["PERSONAL_PAYMENT", "COVERED"];
const WATER_SOURCES = ["Tank", "Well", "Pumped Water"];
const LOCATIONS = ["Main Gate", "Njokerio", "Milimani", "Town", "Blue Valley", "Thika Road", "Roysambu", "Kasarani"];

interface FormData {
    name: string;
    location: string;
    property_type: string;
    monthly_rent: number;
    description: string;
    nearby_school: string;
    landmark: string;
    contact_phone: string;
    available_from: string;
    number_of_units: number;
    electricity_payment: string;
    water_availability_days: number;
    water_source: string;
    room_space_sqm: number;
    deposit_amount: number;
    security_verified: boolean;
    return_deposit: boolean;
    gate_hours_from: string;
    gate_hours_to: string;
    parking_available: boolean;
    latitude: number;
    longitude: number;
    caretaker_first_name: string;
    caretaker_last_name: string;
    caretaker_email: string;
    caretaker_phone: string;
    faqs: { question: string; answer: string }[];
    rules: { text: string }[];
}

const DEFAULT_DATA: FormData = {
    name: "",
    location: "",
    property_type: "Single Room",
    monthly_rent: 0,
    description: "",
    nearby_school: "",
    landmark: "",
    contact_phone: "",
    available_from: new Date().toISOString().split("T")[0],
    number_of_units: 1,
    electricity_payment: "PERSONAL_PAYMENT",
    water_availability_days: 7,
    water_source: "Tank",
    room_space_sqm: 0,
    deposit_amount: 0,
    security_verified: false,
    return_deposit: true,
    gate_hours_from: "06:00",
    gate_hours_to: "22:00",
    parking_available: false,
    latitude: 0,
    longitude: 0,
    caretaker_first_name: "",
    caretaker_last_name: "",
    caretaker_email: "",
    caretaker_phone: "",
    faqs: [],
    rules: [],
};

export default function AddPropertyPage() {
    const router = useRouter();
    const [step, setStep] = useState<StepType>("basic");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [created, setCreated] = useState<{ id: string; tempPassword?: string; units?: number } | null>(null);
    const [data, setData] = useState<FormData>(DEFAULT_DATA);
    const [errors, setErrors] = useState<Set<string>>(new Set());
    const [showCustomLoc, setShowCustomLoc] = useState(false);

    const setField = (field: keyof FormData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => {
            const next = new Set(prev);
            next.delete(field);
            return next;
        });
    };

    const validateStep = (s: StepType): string[] => {
        const e: string[] = [];
        if (s === "basic") {
            if (!data.name.trim()) e.push("name");
            if (!data.location.trim()) e.push("location");
            if (data.monthly_rent <= 0) e.push("monthly_rent");
        }
        if (s === "details") {
            if (data.number_of_units <= 0) e.push("number_of_units");
            if (data.room_space_sqm <= 0) e.push("room_space_sqm");
        }
        if (s === "caretaker") {
            if (!data.caretaker_first_name.trim()) e.push("caretaker_first_name");
            if (!data.caretaker_last_name.trim()) e.push("caretaker_last_name");
            if (!data.caretaker_email.trim()) e.push("caretaker_email");
            if (!data.caretaker_phone.trim()) e.push("caretaker_phone");
        }
        return e;
    };

    const nextStep = () => {
        const e = validateStep(step);
        if (e.length > 0) {
            setErrors(new Set(e));
            setMessage({ type: "error", text: "Please fill all required fields" });
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        const order: StepType[] = ["basic", "details", "caretaker", "faq"];
        const idx = order.indexOf(step);
        if (idx < 3) {
            setStep(order[idx + 1]);
            setMessage(null);
        }
    };

    const prevStep = () => {
        const order: StepType[] = ["basic", "details", "caretaker", "faq"];
        const idx = order.indexOf(step);
        if (idx > 0) setStep(order[idx - 1]);
    };

    const isError = (f: keyof FormData) => errors.has(f);

    const inputClass = (f: keyof FormData, base = "") => 
        `w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
            isError(f) 
                ? "border-red-500 focus:ring-red-500" 
                : "border-slate-700 focus:ring-[#0066FF]"
        } ${base}`;

    const submit = async () => {
        const allErrors = [...validateStep("basic"), ...validateStep("details"), ...validateStep("caretaker")];
        if (allErrors.length > 0) {
            setErrors(new Set(allErrors));
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setLoading(true);
        try {
            const supabase = getSupabaseClient() as any;
            const payload = { p_payload: data };
            const response = await (supabase.rpc as any)("create_property_complete_json", payload);
            if (response.error) throw response.error;
            const res = response.data as { success: boolean; error?: string; property_id?: string; caretaker_temp_password?: string; units_created?: number };
            if (res?.success === false) throw new Error(res.error || "Failed to create property");
            setCreated({ id: res.property_id || "", tempPassword: res.caretaker_temp_password, units: res.units_created });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (created) {
        return (
            <div className="min-h-screen pb-24">
                <AdminTopBar />
                <div className="p-6 max-w-2xl mx-auto">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Property Created!</h2>
                        <p className="text-slate-400 mb-4">{created.units} units generated</p>
                        {created.tempPassword && (
                            <div className="bg-slate-800 rounded-xl p-4 mb-6">
                                <p className="text-sm text-slate-400 mb-1">Caretaker Temporary Password</p>
                                <p className="text-xl font-mono text-white">{created.tempPassword}</p>
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            <Link href="/admin/properties" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">View Properties</Link>
                            <button onClick={() => { setCreated(null); setData(DEFAULT_DATA); setStep("basic"); }} className="px-6 py-3 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl">Add Another</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            <AdminTopBar />
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/properties" className="p-2 hover:bg-slate-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Add New Property</h1>
                </div>

                {message && (
                    <div className={`mb-4 p-4 rounded-xl ${message.type === "error" ? "bg-red-500/20 border border-red-500/30 text-red-300" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"}`}>
                        {message.text}
                    </div>
                )}

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <button onClick={() => setStep(s.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${step === s.id ? "bg-[#0066FF] text-white" : "bg-slate-800 text-slate-400"}`}>
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">{s.number}</span>
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {i < 3 && <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />}
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 rounded-2xl p-6">
                    {step === "basic" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Home className="w-5 h-5" /> Basic Information</h2>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Property Name *</label>
                                <input type="text" value={data.name} onChange={e => setField("name", e.target.value)} className={inputClass("name")} placeholder="Enter property name" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Location *</label>
                                {!showCustomLoc ? (
                                    <select value={data.location} onChange={e => { if (e.target.value === "custom") setShowCustomLoc(true); else setField("location", e.target.value); }} className={inputClass("location")}>
                                        <option value="">Select location</option>
                                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        <option value="custom">+ Add Custom Location</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="text" value={data.location} onChange={e => setField("location", e.target.value)} className={inputClass("location")} placeholder="Enter custom location" />
                                        <button onClick={() => setShowCustomLoc(false)} className="px-3 py-2 bg-slate-700 text-white rounded-xl text-sm">Use List</button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Property Type</label>
                                    <select value={data.property_type} onChange={e => setField("property_type", e.target.value)} className={inputClass("property_type")}>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Monthly Rent *</label>
                                    <input type="number" value={data.monthly_rent || ""} onChange={e => setField("monthly_rent", parseFloat(e.target.value) || 0)} className={inputClass("monthly_rent")} placeholder="0" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <textarea value={data.description} onChange={e => setField("description", e.target.value)} className={inputClass("description", "h-24 resize-none")} placeholder="Property description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nearby School</label>
                                    <input type="text" value={data.nearby_school} onChange={e => setField("nearby_school", e.target.value)} className={inputClass("nearby_school")} placeholder="School name" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Landmark</label>
                                    <input type="text" value={data.landmark} onChange={e => setField("landmark", e.target.value)} className={inputClass("landmark")} placeholder="Nearby landmark" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "details" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Home className="w-5 h-5" /> Property Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Number of Units *</label>
                                    <input type="number" value={data.number_of_units || ""} onChange={e => setField("number_of_units", parseInt(e.target.value) || 0)} className={inputClass("number_of_units")} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Room Space (sqm) *</label>
                                    <input type="number" value={data.room_space_sqm || ""} onChange={e => setField("room_space_sqm", parseFloat(e.target.value) || 0)} className={inputClass("room_space_sqm")} placeholder="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Deposit Amount</label>
                                    <input type="number" value={data.deposit_amount || ""} onChange={e => setField("deposit_amount", parseFloat(e.target.value) || 0)} className={inputClass("deposit_amount")} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Electricity</label>
                                    <select value={data.electricity_payment} onChange={e => setField("electricity_payment", e.target.value)} className={inputClass("electricity_payment")}>
                                        {ELECTRICITY_OPTIONS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Water Source</label>
                                    <select value={data.water_source} onChange={e => setField("water_source", e.target.value)} className={inputClass("water_source")}>
                                        {WATER_SOURCES.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Water Days/Week</label>
                                    <select value={data.water_availability_days} onChange={e => setField("water_availability_days", parseInt(e.target.value))} className={inputClass("water_availability_days")}>
                                        {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} day{d>1?"s":""}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Gate Opens</label>
                                    <input type="time" value={data.gate_hours_from} onChange={e => setField("gate_hours_from", e.target.value)} className={inputClass("gate_hours_from")} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Gate Closes</label>
                                    <input type="time" value={data.gate_hours_to} onChange={e => setField("gate_hours_to", e.target.value)} className={inputClass("gate_hours_to")} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Latitude</label>
                                    <input type="number" step="any" value={data.latitude || ""} onChange={e => setField("latitude", parseFloat(e.target.value) || 0)} className={inputClass("latitude")} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Longitude</label>
                                    <input type="number" step="any" value={data.longitude || ""} onChange={e => setField("longitude", parseFloat(e.target.value) || 0)} className={inputClass("longitude")} placeholder="0" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input type="checkbox" checked={data.security_verified} onChange={e => setField("security_verified", e.target.checked)} className="w-4 h-4 rounded" />
                                    Security Verified
                                </label>
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input type="checkbox" checked={data.return_deposit} onChange={e => setField("return_deposit", e.target.checked)} className="w-4 h-4 rounded" />
                                    Return Deposit
                                </label>
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input type="checkbox" checked={data.parking_available} onChange={e => setField("parking_available", e.target.checked)} className="w-4 h-4 rounded" />
                                    Parking
                                </label>
                            </div>
                        </div>
                    )}

                    {step === "caretaker" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><User className="w-5 h-5" /> Caretaker Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">First Name *</label>
                                    <input type="text" value={data.caretaker_first_name} onChange={e => setField("caretaker_first_name", e.target.value)} className={inputClass("caretaker_first_name")} placeholder="First name" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Last Name *</label>
                                    <input type="text" value={data.caretaker_last_name} onChange={e => setField("caretaker_last_name", e.target.value)} className={inputClass("caretaker_last_name")} placeholder="Last name" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email *</label>
                                <input type="email" value={data.caretaker_email} onChange={e => setField("caretaker_email", e.target.value)} className={inputClass("caretaker_email")} placeholder="caretaker@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Phone *</label>
                                <input type="tel" value={data.caretaker_phone} onChange={e => setField("caretaker_phone", e.target.value)} className={inputClass("caretaker_phone")} placeholder="Phone number" />
                            </div>
                        </div>
                    )}

                    {step === "faq" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><HelpCircle className="w-5 h-5" /> FAQ & Rules</h2>
                            
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-slate-400">Frequently Asked Questions</label>
                                    <button onClick={() => setField("faqs", [...data.faqs, { question: "", answer: "" }])} className="flex items-center gap-1 px-3 py-1 bg-[#0066FF]/20 text-[#0066FF] rounded-lg text-sm hover:bg-[#0066FF]/30">
                                        <Plus className="w-4 h-4" /> Add FAQ
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.faqs.map((faq, i) => (
                                        <div key={i} className="bg-slate-800 p-3 rounded-xl">
                                            <input type="text" value={faq.question} onChange={e => { const newFaqs = [...data.faqs]; newFaqs[i].question = e.target.value; setField("faqs", newFaqs); }} className="w-full mb-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Question" />
                                            <textarea value={faq.answer} onChange={e => { const newFaqs = [...data.faqs]; newFaqs[i].answer = e.target.value; setField("faqs", newFaqs); }} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none h-16" placeholder="Answer" />
                                            <button onClick={() => setField("faqs", data.faqs.filter((_, idx) => idx !== i))} className="mt-2 flex items-center gap-1 text-red-400 text-sm hover:text-red-300">
                                                <Trash2 className="w-4 h-4" /> Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-slate-400">Property Rules</label>
                                    <button onClick={() => setField("rules", [...data.rules, { text: "" }])} className="flex items-center gap-1 px-3 py-1 bg-[#0066FF]/20 text-[#0066FF] rounded-lg text-sm hover:bg-[#0066FF]/30">
                                        <Plus className="w-4 h-4" /> Add Rule
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.rules.map((rule, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input type="text" value={rule.text} onChange={e => { const newRules = [...data.rules]; newRules[i].text = e.target.value; setField("rules", newRules); }} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" placeholder="Enter rule" />
                                            <button onClick={() => setField("rules", data.rules.filter((_, idx) => idx !== i))} className="px-3 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8">
                        {step !== "basic" && (
                            <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
                                <ChevronLeft className="w-5 h-5" /> Back
                            </button>
                        )}
                        {step !== "faq" ? (
                            <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl font-medium">
                                Next Step <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={submit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl font-medium">
                                {loading ? "Creating..." : "Create Property"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
