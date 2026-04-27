"use client";

import React, { useState } from "react";
import { Building2, Package, Plus, Edit2, Trash2, Droplets, Shield, Car, Wifi, Trash } from "lucide-react";
import type { CaretakerFacilities, CaretakerInventoryItem } from "@/lib/caretaker/types";
import { upsertCaretakerFacilities, createInventoryItem, updateInventoryItem } from "@/lib/caretaker/dashboard";

interface FacilitiesInventoryPanelProps {
  facilities: CaretakerFacilities | null;
  inventory: CaretakerInventoryItem[];
  propertyId: string;
  onDataChange: () => void;
}

export const FacilitiesInventoryPanel = ({
  facilities,
  inventory,
  propertyId,
  onDataChange,
}: FacilitiesInventoryPanelProps) => {
  const [activeTab, setActiveTab] = useState<"facilities" | "inventory">("facilities");
  const [loading, setLoading] = useState(false);

  const handleUpdateFacilities = async (data: {
    water_source?: string;
    security?: string;
    parking?: boolean;
    wifi?: boolean;
    trash_collection?: string;
    notes?: string;
  }) => {
    setLoading(true);
    const result = await upsertCaretakerFacilities({
      ...data,
      property_id: propertyId,
    });
    if (result.success) {
      onDataChange();
    }
    setLoading(false);
  };

  const handleCreateInventory = async (data: {
    name: string;
    quantity: number;
    condition?: string;
    notes?: string;
  }) => {
    setLoading(true);
    const result = await createInventoryItem({
      ...data,
      property_id: propertyId,
    });
    if (result.success) {
      onDataChange();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab("facilities")}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "facilities"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Facilities
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "inventory"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory ({inventory.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "facilities" ? (
        <FacilitiesTab
          facilities={facilities}
          onUpdate={handleUpdateFacilities}
          loading={loading}
        />
      ) : (
        <InventoryTab
          inventory={inventory}
          onCreate={handleCreateInventory}
          loading={loading}
        />
      )}
    </div>
  );
};

const FacilitiesTab = ({
  facilities,
  onUpdate,
  loading,
}: {
  facilities: CaretakerFacilities | null;
  onUpdate: (data: any) => void;
  loading: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    water_source: facilities?.water_source || "",
    security: facilities?.security || "",
    parking: facilities?.parking || false,
    wifi: facilities?.wifi || false,
    trash_collection: facilities?.trash_collection || "",
    notes: facilities?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Water Source</label>
          <input
            type="text"
            value={formData.water_source}
            onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            placeholder="e.g., Borehole, Municipal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Security</label>
          <input
            type="text"
            value={formData.security}
            onChange={(e) => setFormData({ ...formData, security: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            placeholder="e.g., 24/7 Guard, CCTV"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.parking}
              onChange={(e) => setFormData({ ...formData, parking: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Parking Available</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.wifi}
              onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">WiFi Available</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trash Collection</label>
          <input
            type="text"
            value={formData.trash_collection}
            onChange={(e) => setFormData({ ...formData, trash_collection: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            placeholder="e.g., Daily, Weekly"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Property Facilities</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FacilityCard
          icon={Droplets}
          label="Water Source"
          value={facilities?.water_source || "Not specified"}
        />
        <FacilityCard
          icon={Shield}
          label="Security"
          value={facilities?.security || "Not specified"}
        />
        <FacilityCard
          icon={Car}
          label="Parking"
          value={facilities?.parking ? "Available" : "Not Available"}
          status={facilities?.parking ? "good" : "neutral"}
        />
        <FacilityCard
          icon={Wifi}
          label="WiFi"
          value={facilities?.wifi ? "Available" : "Not Available"}
          status={facilities?.wifi ? "good" : "neutral"}
        />
        <FacilityCard
          icon={Trash}
          label="Trash Collection"
          value={facilities?.trash_collection || "Not specified"}
        />
      </div>

      {facilities?.notes && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes:</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{facilities.notes}</p>
        </div>
      )}
    </div>
  );
};

const FacilityCard = ({
  icon: Icon,
  label,
  value,
  status = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status?: "good" | "neutral";
}) => (
  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === "good" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const InventoryTab = ({
  inventory,
  onCreate,
  loading,
}: {
  inventory: CaretakerInventoryItem[];
  onCreate: (data: any) => void;
  loading: boolean;
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: 1, condition: "", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(newItem);
    setNewItem({ name: "", quantity: 1, condition: "", notes: "" });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-4">
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
              required
              min={0}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            />
          </div>
          <input
            type="text"
            placeholder="Condition (e.g., Good, Fair, Poor)"
            value={newItem.condition}
            onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
          />
          <textarea
            placeholder="Notes"
            value={newItem.notes}
            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                </div>
              </div>
              {item.condition && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                  {item.condition}
                </span>
              )}
            </div>
            {item.notes && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No inventory items yet.</p>
        </div>
      )}
    </div>
  );
};
