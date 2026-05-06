"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { PropertyApi, CreatePropertyPayload, PropertyFAQInput, PropertyRuleInput } from "@/lib/api/domains/properties";
import { ArrowLeft, Building2, Upload, CheckCircle, Plus, Trash2, Home, User, HelpCircle, FileText, MapPin } from "lucide-react";
import Link from "next/link";

type TabType = "basic" | "details" | "caretaker" | "faq";

const PROPERTY_TYPES = [
    { value: "Bedsitter", label: "Bedsitter" },
    { value: "Single Room", label: "Single Room" },
    { value: "One Bedroom", label: "One Bedroom" },
    { value: "Two Bedroom", label: "Two Bedroom" },
];

const ELECTRICITY_OPTIONS = [
    { value: "PERSONAL_PAYMENT", label: "Personal Payment" },
    { value: "COVERED", label: "Covered" },
];

const WATER_SOURCE_OPTIONS = [
    { value: "Tank", label: "Tank" },
    { value: "Well", label: "Well" },
    { value: "Pumped Water", label: "Pumped Water" },
];

const WATER_DAYS_OPTIONS = [
    { value: 1, label: "1 day per week" },
    { value: 2, label: "2 days per week" },
    { value: 3, label: "3 days per week" },
    { value: 4, label: "4 days per week" },
    { value: 5, label: "5 days per week" },
    { value: 6, label: "6 days per week" },
    { value: 7, label: "7 days per week" },
];

const PREDEFINED_LOCATIONS = [
    "Main Gate",
    "Njokerio",
    "Milimani",
    "Town",
    "Blue Valley",
    "Thika Road",
    "Roysambu",
    "Kasarani",
];

export default function AddPropertyPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("basic");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [createdProperty, setCreatedProperty] = useState<{ 
        id: string; 
        caretaker_password?: string;
        unitsCreated?: number;
    } | null>(null);

    // Location state
    const [locationInput, setLocationInput] = useState("");
    const [showAddLocation, setShowAddLocation] = useState(false);
    const [customLocation, setCustomLocation] = useState("");

    // Form state
    const [formData, setFormData] = useState<CreatePropertyPayload>({
        // Section A - Basic Info
        name: "",
        location: "",
        property_type: "Single Room",
        monthly_rent: 0,
        description: "",
        nearby_school_or_institution: "",
        landmark: "",
        contact_phone: "",
        available_from: new Date().toISOString().split("T")[0],
        logo_url: "",
        cover_photo_url: "",

        // Section B - Details
        number_of_units: 1,
        electricity_payment: "PERSONAL_PAYMENT",
        water_availability_days_per_week: 7,
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

        // Section C - Caretaker Info
        caretaker_first_name: "",
        caretaker_last_name: "",
        caretaker_email: "",
        caretaker_phone: "",

        // Section D - FAQ & Rules
        faqs: [],
        rules: [],
    });

    // FAQ state
    const [faqInputs, setFaqInputs] = useState<{ question: string; answer: string }[]>([]);

    // Rules state
    const [ruleInputs, setRuleInputs] = useState<{ rule_text: string }[]>([]);

    useEffect(() => {
        if (showAddLocation && customLocation) {
            setFormData(prev => ({ ...prev, location: customLocation }));
        } else {
            setFormData(prev => ({ ...prev, location: locationInput }));
        }
    }, [locationInput, customLocation, showAddLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validation
        if (!formData.name.trim()) {
            setMessage({ type: "error", text: "Property name is required" });
            setActiveTab("basic");
            setLoading(false);
            return;
        }

        if (!formData.location.trim()) {
            setMessage({ type: "error", text: "Location is required" });
            setActiveTab("basic");
            setLoading(false);
            return;
        }

        if (formData.monthly_rent <= 0) {
            setMessage({ type: "error", text: "Monthly rent must be greater than 0" });
            setActiveTab("basic");
            setLoading(false);
            return;
        }

        if (formData.number_of_units <= 0) {
            setMessage({ type: "error", text: "Number of units must be greater than 0" });
            setActiveTab("details");
            setLoading(false);
            return;
        }

        if (formData.room_space_sqm <= 0) {
            setMessage({ type: "error", text: "Room space must be greater than 0" });
            setActiveTab("details");
            setLoading(false);
            return;
        }

        if (!formData.caretaker_first_name.trim()) {
            setMessage({ type: "error", text: "Caretaker first name is required" });
            setActiveTab("caretaker");
            setLoading(false);
            return;
        }

        if (!formData.caretaker_last_name.trim()) {
            setMessage({ type: "error", text: "Caretaker last name is required" });
            setActiveTab("caretaker");
            setLoading(false);
            return;
        }

        if (!formData.caretaker_email.trim()) {
            setMessage({ type: "error", text: "Caretaker email is required" });
            setActiveTab("caretaker");
            setLoading(false);
            return;
        }

        if (!formData.caretaker_phone.trim()) {
            setMessage({ type: "error", text: "Caretaker phone is required" });
            setActiveTab("caretaker");
            setLoading(false);
            return;
        }

        // Prepare payload with FAQ and Rules
        const payload: CreatePropertyPayload = {
            ...formData,
            faqs: faqInputs.filter(f => f.question.trim() !== ""),
            rules: ruleInputs.filter(r => r.rule_text.trim() !== ""),
        };

        try {
            const result = await PropertyApi.create(payload);
            setCreatedProperty(result);
            setMessage({ type: "success", text: "Property created successfully!" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to create property" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = <K extends keyof CreatePropertyPayload>(field: K, value: CreatePropertyPayload[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addFaq = () => {
        setFaqInputs(prev => [...prev, { question: "", answer: "" }]);
    };

    const updateFaq = (index: number, field: "question" | "answer", value: string) => {
        setFaqInputs(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
    };

    const removeFaq = (index: number) => {
        setFaqInputs(prev => prev.filter((_, i) => i !== index));
    };

    const addRule = () => {
        setRuleInputs(prev => [...prev, { rule_text: "" }]);
    };

    const updateRule = (index: number, value: string) => {
        setRuleInputs(prev => prev.map((r, i) => i === index ? { rule_text: value } : r));
    };

    const removeRule = (index: number) => {
        setRuleInputs(prev => prev.filter((_, i) => i !== index));
    };

    const getTabIcon = (tab: TabType) => {
        switch (tab) {
            case "basic": return <Home className="w-4 h-4" />;
            case "details": return <Building2 className="w-4 h-4" />;
            case "caretaker": return <User className="w-4 h-4" />;
            case "faq": return <HelpCircle className="w-4 h-4" />;
        }
    };

    if (createdProperty) {
        return (
            <div className="min-h-screen pb-24 lg:pb-8">
                <AdminTopBar />
                <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Property Created!</h2>
                        <p className="text-slate-400 mb-6">
                            {createdProperty.unitsCreated 
                                ? `${createdProperty.unitsCreated} units have been generated.` 
                                : "The property has been added to the registry."}
                        </p>

                        {createdProperty.caretaker_password && (
                            <div className="bg-slate-900/50 rounded-xl p-4 mb-4 text-left">
                                <p className="text-sm text-slate-400 mb-1">Caretaker Password</p>
                                <p className="text-lg font-mono text-emerald-400">{createdProperty.caretaker_password}</p>
                                <p className="text-xs text-amber-400 mt-2">Save this password - it won&apos;t be shown again!</p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Link
                                href="/admin/properties"
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                            >
                                Back to Properties
                            </Link>
                            <button
                                onClick={() => {
                                    setCreatedProperty(null);
                                    setFormData({
                                        name: "",
                                        location: "",
                                        property_type: "Single Room",
                                        monthly_rent: 0,
                                        description: "",
                                        nearby_school_or_institution: "",
                                        landmark: "",
                                        contact_phone: "",
                                        available_from: new Date().toISOString().split("T")[0],
                                        logo_url: "",
                                        cover_photo_url: "",
                                        number_of_units: 1,
                                        electricity_payment: "PERSONAL_PAYMENT",
                                        water_availability_days_per_week: 7,
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
                                    });
                                    setFaqInputs([]);
                                    setRuleInputs([]);
                                    setLocationInput("");
                                    setCustomLocation("");
                                    setShowAddLocation(false);
                                    setMessage(null);
                                }}
                                className="px-6 py-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl transition-colors"
                            >
                                Add Another Property
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/properties"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Add New Property</h1>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"}`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {([
                        { id: "basic", label: "Basic Info" },
                        { id: "details", label: "Details" },
                        { id: "caretaker", label: "Caretaker" },
                        { id: "faq", label: "FAQ & Rules" },
                    ] as { id: TabType; label: string }[]).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                                activeTab === tab.id
                                    ? "bg-[#0066FF] text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                            }`}
                        >
                            {getTabIcon(tab.id)}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-[#0066FF]" />
                                    Section A — Basic House Information
                                </h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Property Name */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Property Name <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            placeholder="e.g., Sunset Apartments"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Location <span className="text-rose-400">*</span>
                                        </label>
                                        {!showAddLocation ? (
                                            <select
                                                value={locationInput}
                                                onChange={(e) => {
                                                    if (e.target.value === "__add_new__") {
                                                        setShowAddLocation(true);
                                                        setLocationInput("");
                                                    } else {
                                                        setLocationInput(e.target.value);
                                                    }
                                                }}
                                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                            >
                                                <option value="">Select location...</option>
                                                {PREDEFINED_LOCATIONS.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                                <option value="__add_new__">+ Add another location</option>
                                            </select>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={customLocation}
                                                    onChange={(e) => setCustomLocation(e.target.value)}
                                                    placeholder="Enter new location..."
                                                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddLocation(false);
                                                        setCustomLocation("");
                                                        setLocationInput("");
                                                    }}
                                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Property Type */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Property Type <span className="text-rose-400">*</span>
                                        </label>
                                        <select
                                            value={formData.property_type}
                                            onChange={(e) => handleChange("property_type", e.target.value as CreatePropertyPayload["property_type"])}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                        >
                                            {PROPERTY_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Monthly Rent */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Monthly Rent (KES) <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={formData.monthly_rent || ""}
                                            onChange={(e) => handleChange("monthly_rent", parseFloat(e.target.value) || 0)}
                                            placeholder="e.g., 8000"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange("description", e.target.value)}
                                            placeholder="Describe the property..."
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none resize-none"
                                        />
                                    </div>

                                    {/* Nearby School */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Nearby School or Institution</label>
                                        <input
                                            type="text"
                                            value={formData.nearby_school_or_institution}
                                            onChange={(e) => handleChange("nearby_school_or_institution", e.target.value)}
                                            placeholder="e.g., USIU-Africa"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Landmark */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Landmark</label>
                                        <input
                                            type="text"
                                            value={formData.landmark}
                                            onChange={(e) => handleChange("landmark", e.target.value)}
                                            placeholder="e.g., Near Thika Road Mall"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Contact Phone */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Contact Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.contact_phone}
                                            onChange={(e) => handleChange("contact_phone", e.target.value)}
                                            placeholder="e.g., +254712345678"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Available From */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Available From</label>
                                        <input
                                            type="date"
                                            value={formData.available_from}
                                            onChange={(e) => handleChange("available_from", e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Logo URL */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Logo URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={formData.logo_url}
                                                onChange={(e) => handleChange("logo_url", e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Cover Photo URL */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Cover Photo URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={formData.cover_photo_url}
                                                onChange={(e) => handleChange("cover_photo_url", e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === "details" && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-[#0066FF]" />
                                    Section B — Details
                                </h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Number of Units */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Number of Units <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={formData.number_of_units || ""}
                                            onChange={(e) => handleChange("number_of_units", parseInt(e.target.value) || 0)}
                                            placeholder="e.g., 10"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">This many units will be auto-generated</p>
                                    </div>

                                    {/* Room Space */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Room Space (sqm) <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            step="0.1"
                                            value={formData.room_space_sqm || ""}
                                            onChange={(e) => handleChange("room_space_sqm", parseFloat(e.target.value) || 0)}
                                            placeholder="e.g., 15.5"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Deposit Amount */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Deposit Amount (KES) <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            value={formData.deposit_amount || ""}
                                            onChange={(e) => handleChange("deposit_amount", parseFloat(e.target.value) || 0)}
                                            placeholder="e.g., 4000"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Electricity Payment */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Electricity Payment <span className="text-rose-400">*</span>
                                        </label>
                                        <select
                                            value={formData.electricity_payment}
                                            onChange={(e) => handleChange("electricity_payment", e.target.value as CreatePropertyPayload["electricity_payment"])}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                        >
                                            {ELECTRICITY_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Water Availability */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Water Availability (days/week) <span className="text-rose-400">*</span>
                                        </label>
                                        <select
                                            value={formData.water_availability_days_per_week}
                                            onChange={(e) => handleChange("water_availability_days_per_week", parseInt(e.target.value))}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                        >
                                            {WATER_DAYS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Water Source */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Water Source <span className="text-rose-400">*</span>
                                        </label>
                                        <select
                                            value={formData.water_source}
                                            onChange={(e) => handleChange("water_source", e.target.value as CreatePropertyPayload["water_source"])}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                        >
                                            {WATER_SOURCE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Gate Hours */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Gate Hours <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="time"
                                                value={formData.gate_hours_from}
                                                onChange={(e) => handleChange("gate_hours_from", e.target.value)}
                                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                            />
                                            <span className="text-slate-400">to</span>
                                            <input
                                                type="time"
                                                value={formData.gate_hours_to}
                                                onChange={(e) => handleChange("gate_hours_to", e.target.value)}
                                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-[#0066FF] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles Row */}
                                    <div className="md:col-span-2 flex flex-wrap gap-6">
                                        {/* Security Verified */}
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.security_verified}
                                                onChange={(e) => handleChange("security_verified", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#0066FF] focus:ring-[#0066FF]"
                                            />
                                            <span className="text-slate-300">Security Verified</span>
                                        </label>

                                        {/* Returnable Deposit */}
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.return_deposit}
                                                onChange={(e) => handleChange("return_deposit", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#0066FF] focus:ring-[#0066FF]"
                                            />
                                            <span className="text-slate-300">Returnable Deposit</span>
                                        </label>

                                        {/* Parking Available */}
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.parking_available}
                                                onChange={(e) => handleChange("parking_available", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#0066FF] focus:ring-[#0066FF]"
                                            />
                                            <span className="text-slate-300">Parking Available</span>
                                        </label>
                                    </div>

                                    {/* Coordinates */}
                                    <div className="md:col-span-2 pt-4 border-t border-slate-800">
                                        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Coordinates (for map location)
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">
                                                    Latitude <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.00000001"
                                                    min="-90"
                                                    max="90"
                                                    value={formData.latitude || ""}
                                                    onChange={(e) => handleChange("latitude", parseFloat(e.target.value) || 0)}
                                                    placeholder="e.g., -1.2189"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">
                                                    Longitude <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.00000001"
                                                    min="-180"
                                                    max="180"
                                                    value={formData.longitude || ""}
                                                    onChange={(e) => handleChange("longitude", parseFloat(e.target.value) || 0)}
                                                    placeholder="e.g., 36.8901"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Caretaker Tab */}
                    {activeTab === "caretaker" && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#0066FF]" />
                                    Section C — Caretaker Information
                                </h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    A caretaker employee record will be created. If the email already exists, the registration will fail.
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            First Name <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.caretaker_first_name}
                                            onChange={(e) => handleChange("caretaker_first_name", e.target.value)}
                                            placeholder="e.g., John"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Last Name <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.caretaker_last_name}
                                            onChange={(e) => handleChange("caretaker_last_name", e.target.value)}
                                            placeholder="e.g., Doe"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Email <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.caretaker_email}
                                            onChange={(e) => handleChange("caretaker_email", e.target.value)}
                                            placeholder="caretaker@example.com"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                        <p className="text-xs text-amber-400 mt-1">
                                            Duplicate email will fail with: &quot;Caretaker with this email already exists.&quot;
                                        </p>
                                    </div>

                                    {/* Phone */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">
                                            Phone <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.caretaker_phone}
                                            onChange={(e) => handleChange("caretaker_phone", e.target.value)}
                                            placeholder="e.g., +254712345678"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FAQ & Rules Tab */}
                    {activeTab === "faq" && (
                        <div className="space-y-6">
                            {/* FAQ Section */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-[#0066FF]" />
                                    Section D — FAQ
                                </h2>

                                <div className="space-y-4">
                                    {faqInputs.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No FAQs added yet.</p>
                                    )}
                                    {faqInputs.map((faq, index) => (
                                        <div key={index} className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-slate-300">FAQ #{index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFaq(index)}
                                                    className="text-rose-400 hover:text-rose-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={faq.question}
                                                onChange={(e) => updateFaq(index, "question", e.target.value)}
                                                placeholder="Question"
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                            />
                                            <textarea
                                                value={faq.answer}
                                                onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                                placeholder="Answer"
                                                rows={2}
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none resize-none"
                                            />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFaq}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add FAQ
                                    </button>
                                </div>
                            </div>

                            {/* Rules Section */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#0066FF]" />
                                    Section D — Property Rules
                                </h2>

                                <div className="space-y-4">
                                    {ruleInputs.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No rules added yet.</p>
                                    )}
                                    {ruleInputs.map((rule, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rule.rule_text}
                                                onChange={(e) => updateRule(index, e.target.value)}
                                                placeholder={`Rule #${index + 1}`}
                                                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-[#0066FF] focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeRule(index)}
                                                className="text-rose-400 hover:text-rose-300 px-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addRule}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                        <Link
                            href="/admin/properties"
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-[#0066FF] hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors font-medium"
                        >
                            {loading ? "Creating Property..." : "Create Property"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
