"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminModal from "@/components/admin/AdminModal";
import {
    getAllProperties,
    getAvailableCaretakers,
    removeCaretakerFromProperty,
    assignCaretakerToProperty,
    addUnitToProperty,
    getPropertyStats,
} from "@/lib/admin/dashboard";
import type { AdminProperty, AdminEmployee, PropertyStats } from "@/lib/admin/types";
import {
    MoreHorizontal,
    Home,
    UserMinus,
    UserPlus,
    Plus,
    BarChart3,
    Users,
    Wrench,
    FileText,
    AlertTriangle,
    X,
    Building2,
} from "lucide-react";

type SortField = "name" | "location" | "occupancy" | "caretaker";
type ModalType = "remove_caretaker" | "assign_caretaker" | "add_room" | "stats" | "details" | null;

export default function AdminPropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<AdminProperty[]>([]);
    const [sortBy, setSortBy] = useState<SortField>("name");
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Available caretakers for assignment
    const [availableCaretakers, setAvailableCaretakers] = useState<AdminEmployee[]>([]);
    const [selectedCaretakerId, setSelectedCaretakerId] = useState<string>("");

    // Add room form state
    const [roomNumber, setRoomNumber] = useState("");
    const [roomType, setRoomType] = useState("SINGLE");
    const [roomPrice, setRoomPrice] = useState("");

    // Property stats
    const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    async function loadProperties() {
        setLoading(true);
        try {
            const data = await getAllProperties();
            setProperties(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProperties();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortedProperties = [...properties].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return (a.name || "").localeCompare(b.name || "");
            case "location":
                return (a.location || "").localeCompare(b.location || "");
            case "caretaker":
                return (a.caretaker_name || "").localeCompare(b.caretaker_name || "");
            case "occupancy":
                const rateA = a.total_units > 0 ? (a.occupied_units / a.total_units) : 0;
                const rateB = b.total_units > 0 ? (b.occupied_units / b.total_units) : 0;
                return rateB - rateA;
            default:
                return 0;
        }
    });

    const caretakerStatusBadge = (status: string | null) => {
        if (!status || status === "ACTIVE") return null;
        if (status === "SUSPENDED")
            return <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">SUSPENDED</span>;
        return <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">{status}</span>;
    };

    const openModal = async (type: ModalType, property: AdminProperty) => {
        setSelectedProperty(property);
        setModalType(type);
        setActiveDropdown(null);
        setMessage(null);
        setSelectedCaretakerId("");
        setRoomNumber("");
        setRoomType("SINGLE");
        setRoomPrice("");
        setPropertyStats(null);

        if (type === "assign_caretaker") {
            const caretakers = await getAvailableCaretakers();
            setAvailableCaretakers(caretakers);
        }

        if (type === "stats") {
            const stats = await getPropertyStats(property.id);
            setPropertyStats(stats);
        }
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedProperty(null);
        setMessage(null);
    };

    const handleRemoveCaretaker = async () => {
        if (!selectedProperty) return;
        setModalLoading(true);
        const result = await removeCaretakerFromProperty(selectedProperty.id);
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: "Caretaker removed from property successfully." });
            await loadProperties();
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to remove caretaker" });
        }
    };

    const handleAssignCaretaker = async () => {
        if (!selectedProperty || !selectedCaretakerId) return;
        setModalLoading(true);
        const result = await assignCaretakerToProperty(selectedProperty.id, selectedCaretakerId);
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: "Caretaker assigned to property successfully." });
            await loadProperties();
            setTimeout(closeModal, 1500);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to assign caretaker" });
        }
    };

    const handleAddRoom = async () => {
        if (!selectedProperty || !roomNumber.trim() || !roomPrice) return;
        setModalLoading(true);
        const result = await addUnitToProperty({
            property_id: selectedProperty.id,
            room_number: roomNumber.trim(),
            room_type: roomType,
            base_price: Number(roomPrice),
        });
        setModalLoading(false);

        if (result.success) {
            setMessage({ type: "success", text: `Room ${roomNumber} added successfully.` });
            setRoomNumber("");
            setRoomPrice("");
            await loadProperties();
        } else {
            setMessage({ type: "error", text: result.error || "Failed to add room" });
        }
    };

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Property Registry</h1>
                        <p className="text-slate-400">Manage properties, caretakers, and rooms.</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin/properties/add")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl transition-colors font-medium"
                    >
                        <Building2 className="w-5 h-5" />
                        Add Property
                    </button>
                </div>

                {message && !modalType && (
                    <div className={`mt-4 p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"}`}>
                        {message.text}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                    {[
                        ["name", "Name"],
                        ["location", "Location"],
                        ["occupancy", "Occupancy rate"],
                        ["caretaker", "Caretaker"],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key as SortField)}
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
                    <table className="min-w-[1000px] w-full text-sm">
                        <thead className="bg-slate-900/90 text-slate-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Property name</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Occupancy</th>
                                <th className="px-4 py-3 text-left">Tenants</th>
                                <th className="px-4 py-3 text-left">Caretaker</th>
                                <th className="px-4 py-3 text-left">Issues</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                        Loading properties...
                                    </td>
                                </tr>
                            ) : sortedProperties.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                        No properties registered yet.
                                    </td>
                                </tr>
                            ) : (
                                sortedProperties.map((property) => (
                                    <tr key={property.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{property.name || "Unnamed"}</div>
                                            <div className="text-xs text-slate-400">{property.property_type || "Property"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{property.location || "N/A"}</td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {property.total_units > 0
                                                ? `${Math.round((property.occupied_units / property.total_units) * 100)}% (${property.occupied_units}/${property.total_units})`
                                                : "0% (0/0)"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{property.tenant_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-slate-300">
                                                    {property.caretaker_name || "Unassigned"}
                                                    {caretakerStatusBadge(property.caretaker_status)}
                                                </span>
                                                {property.caretaker_phone && (
                                                    <span className="text-xs text-slate-500">{property.caretaker_phone}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {property.issues_count > 0 ? (
                                                <span className="text-rose-400">{property.issues_count} open</span>
                                            ) : (
                                                <span className="text-slate-500">None</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative" ref={activeDropdown === property.id ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === property.id ? null : property.id)}
                                                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                                                >
                                                    Manage
                                                    <MoreHorizontal className="w-3 h-3" />
                                                </button>

                                                {activeDropdown === property.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => openModal("details", property)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <Home className="w-4 h-4" />
                                                                View details
                                                            </button>

                                                            <button
                                                                onClick={() => openModal("stats", property)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                View statistics
                                                            </button>

                                                            <div className="border-t border-slate-700 my-1" />

                                                            {property.caretaker_employee_id ? (
                                                                <button
                                                                    onClick={() => openModal("remove_caretaker", property)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
                                                                >
                                                                    <UserMinus className="w-4 h-4" />
                                                                    Remove caretaker
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openModal("assign_caretaker", property)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 transition-colors"
                                                                >
                                                                    <UserPlus className="w-4 h-4" />
                                                                    Assign caretaker
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => openModal("add_room", property)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Add room
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Modals */}
            <AdminModal open={modalType === "remove_caretaker"} onClose={closeModal} title="Remove Caretaker">
                {selectedProperty && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <AlertTriangle className="w-6 h-6" />
                            <p className="font-semibold">Confirm Caretaker Removal</p>
                        </div>
                        <p className="text-slate-300">
                            Remove caretaker from <strong>{selectedProperty.name}</strong>?
                        </p>
                        <p className="text-sm text-slate-400">
                            The caretaker will be unassigned but their account will remain active.
                        </p>
                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveCaretaker}
                                disabled={modalLoading}
                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Removing..." : "Remove Caretaker"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "assign_caretaker"} onClose={closeModal} title="Assign Caretaker">
                {selectedProperty && (
                    <div className="space-y-4">
                        <p className="text-slate-300">
                            Assign a caretaker to <strong>{selectedProperty.name}</strong>
                        </p>

                        {availableCaretakers.length === 0 ? (
                            <div className="bg-amber-500/10 p-3 rounded-lg text-amber-300 text-sm">
                                No available caretakers found. All caretakers are already assigned to properties.
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Select Caretaker</label>
                                <select
                                    value={selectedCaretakerId}
                                    onChange={(e) => setSelectedCaretakerId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                                >
                                    <option value="">-- Select a caretaker --</option>
                                    {availableCaretakers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.full_name || c.email} ({c.phone_number || "No phone"})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignCaretaker}
                                disabled={modalLoading || !selectedCaretakerId || availableCaretakers.length === 0}
                                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Assigning..." : "Assign Caretaker"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "add_room"} onClose={closeModal} title="Add Room">
                {selectedProperty && (
                    <div className="space-y-4">
                        <p className="text-slate-300">
                            Add a new room to <strong>{selectedProperty.name}</strong>
                        </p>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Room Number</label>
                            <input
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                placeholder="e.g., A101"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Room Type</label>
                            <select
                                value={roomType}
                                onChange={(e) => setRoomType(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            >
                                <option value="SINGLE">Single</option>
                                <option value="DOUBLE">Double</option>
                                <option value="BEDSITTER">Bedsitter</option>
                                <option value="ONE_BEDROOM">One Bedroom</option>
                                <option value="TWO_BEDROOM">Two Bedroom</option>
                                <option value="STUDIO">Studio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Base Price (per month)</label>
                            <input
                                type="number"
                                value={roomPrice}
                                onChange={(e) => setRoomPrice(e.target.value)}
                                placeholder="e.g., 8000"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button onClick={closeModal} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRoom}
                                disabled={modalLoading || !roomNumber.trim() || !roomPrice}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                {modalLoading ? "Adding..." : "Add Room"}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "stats"} onClose={closeModal} title="Property Statistics" fullScreen>
                {selectedProperty && propertyStats && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{propertyStats.total_units}</p>
                                <p className="text-xs text-slate-400">Total Units</p>
                            </div>
                            <div className="bg-emerald-500/10 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-emerald-400">{propertyStats.occupied_units}</p>
                                <p className="text-xs text-slate-400">Occupied</p>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-400">{propertyStats.vacant_units}</p>
                                <p className="text-xs text-slate-400">Vacant</p>
                            </div>
                            <div className="bg-amber-500/10 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-amber-400">{propertyStats.maintenance_units}</p>
                                <p className="text-xs text-slate-400">Maintenance</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{propertyStats.tenant_count}</p>
                                <p className="text-xs text-slate-400">Tenants</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{propertyStats.leases_count}</p>
                                <p className="text-xs text-slate-400">Active Leases</p>
                            </div>
                            <div className="bg-rose-500/10 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-rose-400">{propertyStats.pending_issues}</p>
                                <p className="text-xs text-slate-400">Pending Issues</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{propertyStats.average_rating?.toFixed(1) || "N/A"}</p>
                                <p className="text-xs text-slate-400">Avg Rating ({propertyStats.review_count})</p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                            Close
                        </button>
                    </div>
                )}
                {selectedProperty && !propertyStats && (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-slate-400">Loading statistics...</p>
                    </div>
                )}
            </AdminModal>

            <AdminModal open={modalType === "details"} onClose={closeModal} title="Property Details" fullScreen>
                {selectedProperty && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Property Name</p>
                                <p className="text-sm text-white">{selectedProperty.name || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Location</p>
                                <p className="text-sm text-white">{selectedProperty.location || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Type</p>
                                <p className="text-sm text-white">{selectedProperty.property_type || "Property"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-400">Verification Status</p>
                                <p className="text-sm text-white">{selectedProperty.verification_status || "UNVERIFIED"}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg col-span-2">
                                <p className="text-xs text-slate-400">Caretaker</p>
                                <p className="text-sm text-white">
                                    {selectedProperty.caretaker_name || "Unassigned"}
                                    {selectedProperty.caretaker_status && selectedProperty.caretaker_status !== "ACTIVE" && (
                                        <span className="ml-2 text-rose-400">({selectedProperty.caretaker_status})</span>
                                    )}
                                </p>
                                {selectedProperty.caretaker_phone && (
                                    <p className="text-xs text-slate-500">{selectedProperty.caretaker_phone}</p>
                                )}
                            </div>
                            {selectedProperty.caretaker_password && (
                                <div className="bg-amber-500/10 p-3 rounded-lg col-span-2 border border-amber-500/30">
                                    <p className="text-xs text-amber-400 mb-1">Caretaker Password (Admin Only)</p>
                                    <p className="text-lg font-mono text-emerald-400">{selectedProperty.caretaker_password}</p>
                                    <p className="text-xs text-slate-500 mt-1">Visible until caretaker changes password</p>
                                </div>
                            )}
                        </div>
                        <button onClick={closeModal} className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                            Close
                        </button>
                    </div>
                )}
            </AdminModal>
        </div>
    );
}
