"use client";

import React, { useState } from "react";
import { DoorOpen, Plus, Edit2, Check, X, AlertCircle } from "lucide-react";
import type { CaretakerUnit } from "@/lib/caretaker/types";
import { updateUnitAvailability, setUnitStatus } from "@/lib/caretaker/dashboard";

interface UnitsPanelProps {
  units: CaretakerUnit[];
  propertyId: string;
  onDataChange: () => void;
}

const availabilityOptions = [
  { value: "AVAILABLE", label: "Available", color: "bg-emerald-500" },
  { value: "RESERVED", label: "Reserved", color: "bg-amber-500" },
  { value: "OCCUPIED", label: "Occupied", color: "bg-blue-500" },
  { value: "UNDER_MAINTENANCE", label: "Maintenance", color: "bg-rose-500" },
  { value: "UNAVAILABLE", label: "Unavailable", color: "bg-slate-500" },
];

export const UnitsPanel = ({ units, propertyId, onDataChange }: UnitsPanelProps) => {
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredUnits = units.filter((unit) => {
    if (filter === "all") return true;
    return unit.availability_status === filter;
  });

  const handleStatusChange = async (unitId: string, newStatus: string) => {
    setLoading(unitId);
    const result = await setUnitStatus(unitId, newStatus as any);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
    setEditingUnit(null);
  };

  const stats = {
    total: units.length,
    available: units.filter((u) => u.availability_status === "AVAILABLE").length,
    occupied: units.filter((u) => u.availability_status === "OCCUPIED").length,
    reserved: units.filter((u) => u.availability_status === "RESERVED").length,
    maintenance: units.filter((u) => u.availability_status === "UNDER_MAINTENANCE").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="bg-slate-500" />
        <StatCard label="Available" value={stats.available} color="bg-emerald-500" />
        <StatCard label="Occupied" value={stats.occupied} color="bg-blue-500" />
        <StatCard label="Reserved" value={stats.reserved} color="bg-amber-500" />
        <StatCard label="Maintenance" value={stats.maintenance} color="bg-rose-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterButton active={filter === "AVAILABLE"} onClick={() => setFilter("AVAILABLE")} label="Available" color="emerald" />
        <FilterButton active={filter === "OCCUPIED"} onClick={() => setFilter("OCCUPIED")} label="Occupied" color="blue" />
        <FilterButton active={filter === "RESERVED"} onClick={() => setFilter("RESERVED")} label="Reserved" color="amber" />
        <FilterButton active={filter === "UNDER_MAINTENANCE"} onClick={() => setFilter("UNDER_MAINTENANCE")} label="Maintenance" color="rose" />
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isEditing={editingUnit === unit.id}
            isLoading={loading === unit.id}
            onEdit={() => setEditingUnit(unit.id)}
            onCancel={() => setEditingUnit(null)}
            onStatusChange={(status) => handleStatusChange(unit.id, status)}
          />
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <DoorOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No units found for this filter.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
    <div className={`w-3 h-3 rounded-full ${color} mb-2`} />
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

const FilterButton = ({
  active,
  onClick,
  label,
  color = "slate",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) => {
  const colorClasses: Record<string, string> = {
    slate: active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    emerald: active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rose: active ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
};

const UnitCard = ({
  unit,
  isEditing,
  isLoading,
  onEdit,
  onCancel,
  onStatusChange,
}: {
  unit: CaretakerUnit;
  isEditing: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onStatusChange: (status: string) => void;
}) => {
  const currentStatus = availabilityOptions.find((o) => o.value === unit.availability_status);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Room {unit.room_number || "Unknown"}
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-7">{unit.room_type}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
            currentStatus?.color || "bg-slate-500"
          }`}
        >
          {currentStatus?.label || unit.availability_status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Price:</span>
          <span className="font-medium text-slate-900 dark:text-white">KES {unit.base_price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Capacity:</span>
          <span className="font-medium text-slate-900 dark:text-white">{unit.capacity} person(s)</span>
        </div>
        {unit.deposit_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Deposit:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              KES {unit.deposit_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Update Status:</p>
          <div className="grid grid-cols-2 gap-2">
            {availabilityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  unit.availability_status === option.value
                    ? `${option.color} text-white`
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Update Status
        </button>
      )}
    </div>
  );
};
