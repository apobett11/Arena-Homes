"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { DoorOpen, Edit2, Eye, Search, UserPlus } from "lucide-react";
import type { CaretakerUnit } from "@/lib/caretaker/types";
import { setUnitStatus } from "@/lib/caretaker/dashboard";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface UnitsPanelProps {
  units: CaretakerUnit[];
  propertyId: string;
  onDataChange: () => void;
}

const availabilityOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "UNDER_MAINTENANCE", label: "Maintenance" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export const UnitsPanel = ({ units, onDataChange }: UnitsPanelProps) => {
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredUnits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return units.filter((unit) => {
      const matchesFilter = filter === "all" || unit.availability_status === filter;
      const matchesSearch =
        !query ||
        unit.room_number?.toLowerCase().includes(query) ||
        unit.room_type?.toLowerCase().includes(query) ||
        unit.status?.toLowerCase().includes(query) ||
        unit.availability_status?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm, units]);

  const handleStatusChange = async (unitId: string, newStatus: string) => {
    setLoading(unitId);
    setFeedback(null);
    const result = await setUnitStatus(unitId, newStatus as Parameters<typeof setUnitStatus>[1]);
    if (result.success) {
      setFeedback("Unit status updated.");
      onDataChange();
    } else {
      setFeedback(result.error || "Could not update unit status.");
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
      <PanelHeader
        title="Units Management"
        description="Inventory and real-time status tracking for assigned rooms."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total units" value={stats.total} accent="border-primary" />
        <StatCard label="Available" value={stats.available} accent="border-emerald-500" />
        <StatCard label="Occupied" value={stats.occupied} accent="border-blue-500" />
        <StatCard label="Reserved" value={stats.reserved} accent="border-amber-500" />
        <StatCard label="Maintenance" value={stats.maintenance} accent="border-error" />
      </div>

      <div className="caretaker-card p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by unit, type, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(ck.input, "w-full pl-10")}
          />
        </div>
        <div className={ck.tabBar}>
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {availabilityOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={filter === option.value}
              onClick={() => setFilter(option.value)}
              label={option.label}
            />
          ))}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-low px-4 py-3 text-sm text-arena-on-surface-variant">
          {feedback}
        </div>
      )}

      <div className={cn(ck.tableWrap, "hidden md:block")}>
        <div className="caretaker-table-scroll">
          <table className="w-full text-left border-collapse">
            <thead className={ck.tableHead}>
              <tr>
                <th className={ck.tableHeader}>Room</th>
                <th className={ck.tableHeader}>Type</th>
                <th className={ck.tableHeader}>Price</th>
                <th className={ck.tableHeader}>Capacity</th>
                <th className={ck.tableHeader}>Status</th>
                <th className={ck.tableHeader}>Deposit</th>
                <th className={cn(ck.tableHeader, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-outline-variant/60">
              {filteredUnits.map((unit) => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  isEditing={editingUnit === unit.id}
                  isLoading={loading === unit.id}
                  onEdit={() => setEditingUnit(unit.id)}
                  onCancel={() => setEditingUnit(null)}
                  onStatusChange={(status) => handleStatusChange(unit.id, status)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
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
        <div className={ck.empty}>
          <DoorOpen className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No units found for this search or filter.</p>
        </div>
      )}
    </div>
  );
};

const PanelHeader = ({ title, description }: { title: string; description: string }) => (
  <div>
    <h2 className={ck.display}>{title}</h2>
    <p className={ck.body}>{description}</p>
  </div>
);

const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className={cn(ck.statCard, "border-l-4", accent)}>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="caretaker-display-lg text-arena-on-surface mt-1">{value}</p>
  </div>
);

const FilterButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className={filterButtonClass(active)}>
    {label}
  </button>
);

const UnitRow = ({
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
  return (
    <tr className={ck.tableRow}>
      <td className={ck.tableCell}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-arena-surface-container flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold">Room {unit.room_number || "Unknown"}</span>
        </div>
      </td>
      <td className={cn(ck.tableCell, "text-arena-on-surface-variant")}>{unit.room_type}</td>
      <td className={cn(ck.tableCell, "font-semibold")}>KES {unit.base_price.toLocaleString()}</td>
      <td className={cn(ck.tableCell, "text-arena-on-surface-variant")}>{unit.capacity} person(s)</td>
      <td className={ck.tableCell}>
        {isEditing ? (
          <InlineStatusEditor
            current={unit.availability_status}
            isLoading={isLoading}
            onCancel={onCancel}
            onStatusChange={onStatusChange}
          />
        ) : (
          <span className={statusChipClass(statusToneFromValue(unit.availability_status))}>
            {formatStatus(unit.availability_status)}
          </span>
        )}
      </td>
      <td className={cn(ck.tableCell, "text-arena-on-surface-variant")}>
        {unit.deposit_amount ? `KES ${unit.deposit_amount.toLocaleString()}` : "Not set"}
      </td>
      <td className={cn(ck.tableCell, "text-right")}>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onEdit} className={cn(ck.btnManage, "px-3")}>
            <Edit2 className="w-4 h-4" />
            Update status
          </button>
          {unit.availability_status === "AVAILABLE" && (
            <Link href="/caretaker/dashboard?tab=applications" className={cn(ck.btnSuccess, "px-3")}>
              <UserPlus className="w-4 h-4" />
              Assign tenant
            </Link>
          )}
        </div>
      </td>
    </tr>
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
}) => (
  <div className={ck.card}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className={ck.iconTile}>
          <DoorOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-arena-on-surface">Room {unit.room_number || "Unknown"}</h3>
          <p className={ck.body}>{unit.room_type}</p>
        </div>
      </div>
      <span className={statusChipClass(statusToneFromValue(unit.availability_status))}>
        {formatStatus(unit.availability_status)}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
      <Info label="Price" value={`KES ${unit.base_price.toLocaleString()}`} />
      <Info label="Capacity" value={`${unit.capacity} person(s)`} />
      <Info label="Deposit" value={unit.deposit_amount ? `KES ${unit.deposit_amount.toLocaleString()}` : "Not set"} />
      <Info label="System status" value={unit.status} />
    </div>

    {isEditing ? (
      <InlineStatusEditor
        current={unit.availability_status}
        isLoading={isLoading}
        onCancel={onCancel}
        onStatusChange={onStatusChange}
      />
    ) : (
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className={cn(ck.btnManage, "flex-1")}>
          <Edit2 className="w-4 h-4" />
          Update status
        </button>
        <Link href="/caretaker/dashboard?tab=applications" className={cn(ck.btnGhost, "px-3")} aria-label="View assignment workflow">
          <Eye className="w-4 h-4" />
        </Link>
      </div>
    )}
  </div>
);

const InlineStatusEditor = ({
  current,
  isLoading,
  onCancel,
  onStatusChange,
}: {
  current: string;
  isLoading: boolean;
  onCancel: () => void;
  onStatusChange: (status: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {availabilityOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onStatusChange(option.value)}
          disabled={isLoading}
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50",
            current === option.value ? "bg-primary text-white" : "bg-arena-surface-container-low text-arena-on-surface-variant"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
    <button type="button" onClick={onCancel} disabled={isLoading} className="text-xs font-semibold text-arena-on-surface-variant hover:text-arena-on-surface">
      Cancel
    </button>
  </div>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="font-semibold text-arena-on-surface mt-1">{value}</p>
  </div>
);

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
