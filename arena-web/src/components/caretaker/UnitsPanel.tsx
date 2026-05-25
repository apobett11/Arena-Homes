"use client";

import React, { useMemo, useState } from "react";
import {
  Camera,
  ChevronDown,
  DoorOpen,
  Edit2,
  Eye,
  Image as ImageIcon,
  Search,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import type { CaretakerRepair, CaretakerUnit } from "@/lib/caretaker/types";
import { reserveCaretakerUnit, setUnitStatus } from "@/lib/caretaker/dashboard";
import { cn, ck, filterButtonClass, statusChipClass, statusToneFromValue } from "./caretaker-ui";

interface UnitsPanelProps {
  units: CaretakerUnit[];
  repairs?: CaretakerRepair[];
  propertyId: string;
  onDataChange: () => void;
  onOpenApplications?: () => void;
  onOpenPhotos?: () => void;
}

type UnitModal = "overview" | "repairs" | "photos" | null;

const availabilityOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "UNDER_MAINTENANCE", label: "Maintenance" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export const UnitsPanel = ({
  units,
  repairs = [],
  onDataChange,
  onOpenApplications = () => undefined,
  onOpenPhotos = () => undefined,
}: UnitsPanelProps) => {
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<CaretakerUnit | null>(null);
  const [activeModal, setActiveModal] = useState<UnitModal>(null);

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

  const handleReserve = async (unit: CaretakerUnit) => {
    setOpenMenuId(null);
    setLoading(unit.id);
    setFeedback(null);
    const result = await reserveCaretakerUnit(unit.id);
    if (result.success) {
      setFeedback(`Room ${unit.room_number || "unit"} reserved.`);
      onDataChange();
    } else {
      setFeedback(result.error || "Could not reserve unit.");
    }
    setLoading(null);
  };

  const openUnitModal = (unit: CaretakerUnit, modal: Exclude<UnitModal, null>) => {
    setSelectedUnit(unit);
    setActiveModal(modal);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setSelectedUnit(null);
    setActiveModal(null);
  };

  const stats = {
    total: units.length,
    available: units.filter((u) => u.availability_status === "AVAILABLE").length,
    occupied: units.filter((u) => u.availability_status === "OCCUPIED" || u.current_tenant_id).length,
    reserved: units.filter((u) => u.availability_status === "RESERVED").length,
    maintenance: units.filter((u) => u.availability_status === "UNDER_MAINTENANCE").length,
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Units Management"
        description="Inventory, availability, repairs, reservations, and media workflows for assigned rooms."
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
                  menuOpen={openMenuId === unit.id}
                  onEdit={() => {
                    setEditingUnit(unit.id);
                    setOpenMenuId(null);
                  }}
                  onCancel={() => setEditingUnit(null)}
                  onStatusChange={(status) => handleStatusChange(unit.id, status)}
                  onToggleMenu={() => setOpenMenuId((current) => (current === unit.id ? null : unit.id))}
                  onOpenModal={openUnitModal}
                  onReserve={() => handleReserve(unit)}
                  onOpenApplications={onOpenApplications}
                  onOpenPhotos={onOpenPhotos}
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
            menuOpen={openMenuId === unit.id}
            onEdit={() => {
              setEditingUnit(unit.id);
              setOpenMenuId(null);
            }}
            onCancel={() => setEditingUnit(null)}
            onStatusChange={(status) => handleStatusChange(unit.id, status)}
            onToggleMenu={() => setOpenMenuId((current) => (current === unit.id ? null : unit.id))}
            onOpenModal={openUnitModal}
            onReserve={() => handleReserve(unit)}
            onOpenApplications={onOpenApplications}
            onOpenPhotos={onOpenPhotos}
          />
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <div className={ck.empty}>
          <DoorOpen className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No units found for this search or filter.</p>
        </div>
      )}

      {selectedUnit && activeModal === "overview" && (
        <UnitOverviewModal unit={selectedUnit} onClose={closeModal} />
      )}
      {selectedUnit && activeModal === "repairs" && (
        <UnitRepairsModal
          unit={selectedUnit}
          repairs={repairs.filter((repair) => repair.unit_id === selectedUnit.id)}
          onClose={closeModal}
        />
      )}
      {selectedUnit && activeModal === "photos" && (
        <UnitPhotosModal unit={selectedUnit} onClose={closeModal} onOpenPhotos={onOpenPhotos} />
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
  menuOpen,
  onEdit,
  onCancel,
  onStatusChange,
  onToggleMenu,
  onOpenModal,
  onReserve,
  onOpenApplications,
  onOpenPhotos,
}: UnitActionProps & {
  isEditing: boolean;
  isLoading: boolean;
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
        <UnitActions
          unit={unit}
          menuOpen={menuOpen}
          onToggleMenu={onToggleMenu}
          onOpenModal={onOpenModal}
          onEdit={onEdit}
          onReserve={onReserve}
          onOpenApplications={onOpenApplications}
          onOpenPhotos={onOpenPhotos}
          alignRight
        />
      </td>
    </tr>
  );
};

const UnitCard = ({
  unit,
  isEditing,
  isLoading,
  menuOpen,
  onEdit,
  onCancel,
  onStatusChange,
  onToggleMenu,
  onOpenModal,
  onReserve,
  onOpenApplications,
  onOpenPhotos,
}: UnitActionProps & {
  isEditing: boolean;
  isLoading: boolean;
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
      <UnitActions
        unit={unit}
        menuOpen={menuOpen}
        onToggleMenu={onToggleMenu}
        onOpenModal={onOpenModal}
        onEdit={onEdit}
        onReserve={onReserve}
        onOpenApplications={onOpenApplications}
        onOpenPhotos={onOpenPhotos}
        fullWidth
      />
    )}
  </div>
);

interface UnitActionProps {
  unit: CaretakerUnit;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenModal: (unit: CaretakerUnit, modal: Exclude<UnitModal, null>) => void;
  onEdit: () => void;
  onReserve: () => void;
  onOpenApplications: () => void;
  onOpenPhotos: () => void;
}

const UnitActions = ({
  unit,
  menuOpen,
  onToggleMenu,
  onOpenModal,
  onEdit,
  onReserve,
  onOpenApplications,
  onOpenPhotos,
  alignRight,
  fullWidth,
}: UnitActionProps & { alignRight?: boolean; fullWidth?: boolean }) => {
  const canReserve = unit.availability_status === "AVAILABLE" && !unit.current_tenant_id;

  return (
    <div className={cn("relative inline-block text-left", fullWidth && "w-full")}>
      <button type="button" onClick={onToggleMenu} className={cn(ck.btnManage, fullWidth ? "w-full" : "px-3")}>
        Actions
        <ChevronDown className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div className={cn("absolute z-40 mt-2 w-56 rounded-xl border border-arena-outline-variant/70 bg-white p-2 text-left shadow-xl", alignRight && "right-0")}>
          <ActionButton icon={Eye} label="Overview" onClick={() => onOpenModal(unit, "overview")} />
          <ActionButton icon={Wrench} label="Repairs" onClick={() => onOpenModal(unit, "repairs")} />
          <ActionButton icon={ImageIcon} label="Photos" onClick={() => onOpenModal(unit, "photos")} />
          <ActionButton icon={Edit2} label="Update status" onClick={onEdit} />
          <ActionButton icon={UserPlus} label="Assign via applications" onClick={onOpenApplications} />
          <ActionButton icon={Camera} label="Property photos" onClick={onOpenPhotos} />
          <button type="button" onClick={onReserve} disabled={!canReserve} className={cn(actionItemClass(), !canReserve && "opacity-50 cursor-not-allowed")}>
            <DoorOpen className="w-4 h-4" />
            Reserve
          </button>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button type="button" onClick={onClick} className={actionItemClass()}>
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

function actionItemClass() {
  return "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:hover:bg-white disabled:hover:text-slate-700";
}

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

const UnitOverviewModal = ({ unit, onClose }: { unit: CaretakerUnit; onClose: () => void }) => (
  <Modal title={`Room ${unit.room_number || "Unknown"}`} subtitle="Unit overview" onClose={onClose}>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Info label="Type" value={unit.room_type} />
      <Info label="Availability" value={formatStatus(unit.availability_status)} />
      <Info label="System status" value={unit.status} />
      <Info label="Price" value={`KES ${unit.base_price.toLocaleString()}`} />
      <Info label="Deposit" value={unit.deposit_amount ? `KES ${unit.deposit_amount.toLocaleString()}` : "Not set"} />
      <Info label="Capacity" value={`${unit.capacity} person(s)`} />
      <Info label="Bedrooms" value={unit.bedrooms?.toString() || "Not set"} />
      <Info label="Bathrooms" value={unit.bathrooms?.toString() || "Not set"} />
      <Info label="Current tenant" value={unit.current_tenant_id ? "Assigned" : "Vacant"} />
      <Info label="Public listing" value={unit.is_public ? "Visible" : "Hidden"} />
    </div>
  </Modal>
);

const UnitRepairsModal = ({
  unit,
  repairs,
  onClose,
}: {
  unit: CaretakerUnit;
  repairs: CaretakerRepair[];
  onClose: () => void;
}) => (
  <Modal title="Repairs" subtitle={`Room ${unit.room_number || "Unknown"}`} onClose={onClose}>
    {repairs.length === 0 ? (
      <EmptyState text="No repair records found for this unit." />
    ) : (
      <div className="space-y-3">
        {repairs.map((repair) => (
          <div key={repair.id} className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-arena-on-surface">{repair.title}</p>
                <p className={ck.body}>{repair.tenant?.full_name || "No tenant attached"}</p>
              </div>
              <span className={statusChipClass(statusToneFromValue(repair.status))}>{repair.status.replace("_", " ")}</span>
            </div>
            {repair.description && <p className="mt-2 text-sm text-arena-on-surface-variant">{repair.description}</p>}
            {repair.issue && (
              <div className="mt-3 rounded-lg bg-arena-surface-container-low p-3 text-sm">
                <p className={ck.sectionTitle}>Linked issue</p>
                <p className="font-semibold text-arena-on-surface">{repair.issue.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </Modal>
);

const UnitPhotosModal = ({
  unit,
  onClose,
  onOpenPhotos,
}: {
  unit: CaretakerUnit;
  onClose: () => void;
  onOpenPhotos: () => void;
}) => (
  <Modal title="Unit photos" subtitle={`Room ${unit.room_number || "Unknown"}`} onClose={onClose}>
    {unit.photos && unit.photos.length > 0 ? (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {unit.photos.map((photoUrl, index) => (
          <a key={photoUrl} href={photoUrl} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-low">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={`Room ${unit.room_number || ""} photo ${index + 1}`} className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    ) : (
      <EmptyState text="No unit-specific photo URLs are stored for this unit." />
    )}
    <button
      type="button"
      onClick={() => {
        onClose();
        onOpenPhotos();
      }}
      className={cn(ck.btnPrimary, "mt-4 w-full")}
    >
      <ImageIcon className="w-4 h-4" />
      Open property photos workflow
    </button>
  </Modal>
);

const Modal = ({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className={ck.modalBackdrop} role="dialog" aria-modal="true">
    <div className={ck.modalPanel}>
      <div className="flex items-start justify-between border-b border-arena-outline-variant/60 p-4">
        <div>
          <h2 className={ck.headline}>{title}</h2>
          <p className={ck.body}>{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className={ck.btnGhost} aria-label="Close modal">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
    </div>
  </div>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className={ck.sectionTitle}>{label}</p>
    <p className="font-semibold text-arena-on-surface mt-1">{value}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-arena-outline-variant/60 bg-arena-surface-container-lowest p-4 text-sm text-arena-on-surface-variant">
    {text}
  </div>
);

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
