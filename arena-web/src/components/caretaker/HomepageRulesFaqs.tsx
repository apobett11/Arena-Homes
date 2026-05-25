"use client";

import React, { useState } from "react";
import { Edit2, FileText, HelpCircle, Plus, Trash2 } from "lucide-react";
import type { CaretakerFaq, CaretakerRule } from "@/lib/caretaker/types";
import {
  createCaretakerFaq,
  createCaretakerRule,
  deleteCaretakerFaq,
  deleteCaretakerRule,
  updateCaretakerFaq,
  updateCaretakerRule,
} from "@/lib/caretaker/dashboard";
import { cn, ck } from "./caretaker-ui";

interface HomepageRulesFaqsProps {
  rules: CaretakerRule[];
  faqs: CaretakerFaq[];
  propertyId: string;
  onDataChange: () => void;
}

export const HomepageRulesFaqs = ({
  rules,
  faqs,
  propertyId,
  onDataChange,
}: HomepageRulesFaqsProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    type: "rule" | "faq";
    mode: "create" | "edit";
    item?: CaretakerRule | CaretakerFaq;
  } | null>(null);

  const activeRules = rules.filter((r) => r.is_active);
  const activeFaqs = faqs.filter((f) => f.is_active);

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Deactivate this rule?")) return;
    setLoading(id);
    const result = await deleteCaretakerRule(id);
    if (result.success) onDataChange();
    setLoading(null);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Deactivate this FAQ?")) return;
    setLoading(id);
    const result = await deleteCaretakerFaq(id);
    if (result.success) onDataChange();
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <RulesBlock
        title="Property rules"
        icon={FileText}
        items={activeRules}
        loading={loading}
        onAdd={() => setModal({ type: "rule", mode: "create" })}
        onEdit={(item) => setModal({ type: "rule", mode: "edit", item })}
        onDelete={handleDeleteRule}
        renderTitle={(r) => r.title ?? ""}
        renderBody={(r) => r.description ?? ""}
      />
      <RulesBlock
        title="Frequently asked questions"
        icon={HelpCircle}
        items={activeFaqs}
        loading={loading}
        onAdd={() => setModal({ type: "faq", mode: "create" })}
        onEdit={(item) => setModal({ type: "faq", mode: "edit", item })}
        onDelete={handleDeleteFaq}
        renderTitle={(f) => f.question ?? ""}
        renderBody={(f) => f.answer ?? ""}
      />

      {modal && (
        <EditModal
          modal={modal}
          propertyId={propertyId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            onDataChange();
          }}
        />
      )}
    </div>
  );
};

function RulesBlock<T extends { id: string }>({
  title,
  icon: Icon,
  items,
  loading,
  onAdd,
  onEdit,
  onDelete,
  renderTitle,
  renderBody,
}: {
  title: string;
  icon: React.ElementType;
  items: T[];
  loading: string | null;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderTitle: (item: T) => string;
  renderBody: (item: T) => string;
}) {
  return (
    <div className="caretaker-card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={ck.iconTile}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={ck.sectionTitle}>Tenant guidance</p>
            <h3 className={ck.headline}>{title}</h3>
          </div>
        </div>
        <button type="button" onClick={onAdd} className={cn(ck.btnPrimary, "min-h-[36px] px-3 py-1.5 text-xs")}>
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className={ck.body}>No active entries yet. Add your first item for tenants.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="group rounded-xl border border-[#0d3b66]/10 bg-[#f8fafc] p-4 transition hover:border-[#0d3b66]/20 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0f1c2e]">{renderTitle(item)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c6b7a] line-clamp-3">{renderBody(item)}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    disabled={loading === item.id}
                    className="rounded-lg p-2 text-[#0d3b66] hover:bg-[#e8f0fa]"
                    aria-label="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={loading === item.id}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditModal({
  modal,
  propertyId,
  onClose,
  onSaved,
}: {
  modal: {
    type: "rule" | "faq";
    mode: "create" | "edit";
    item?: CaretakerRule | CaretakerFaq;
  };
  propertyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isRule = modal.type === "rule";
  const isEdit = modal.mode === "edit";
  const [primary, setPrimary] = useState(
    isRule
      ? (modal.item as CaretakerRule | undefined)?.title ?? ""
      : (modal.item as CaretakerFaq | undefined)?.question ?? ""
  );
  const [secondary, setSecondary] = useState(
    isRule
      ? (modal.item as CaretakerRule | undefined)?.description ?? ""
      : (modal.item as CaretakerFaq | undefined)?.answer ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let result: { success: boolean; error?: string };
    if (isRule) {
      if (isEdit && modal.item) {
        result = await updateCaretakerRule(modal.item.id, { title: primary, description: secondary });
      } else {
        result = await createCaretakerRule({
          property_id: propertyId,
          title: primary,
          description: secondary,
        });
      }
    } else if (isEdit && modal.item) {
      result = await updateCaretakerFaq(modal.item.id, { question: primary, answer: secondary });
    } else {
      result = await createCaretakerFaq({
        property_id: propertyId,
        question: primary,
        answer: secondary,
      });
    }

    setSaving(false);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error || "Could not save.");
    }
  };

  return (
    <div className={ck.modalBackdrop} onClick={onClose}>
      <div
        className="caretaker-card w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={ck.headline}>
          {isEdit ? "Edit" : "Add"} {isRule ? "rule" : "FAQ"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={ck.fieldLabel}>{isRule ? "Title" : "Question"}</label>
            <input
              className={ck.input}
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={ck.fieldLabel}>{isRule ? "Description" : "Answer"}</label>
            <textarea
              className={cn(ck.input, "min-h-[100px]")}
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={ck.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={ck.btnPrimary}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
