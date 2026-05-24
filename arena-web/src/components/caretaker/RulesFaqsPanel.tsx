"use client";

import React, { useState } from "react";
import { FileText, Plus, Edit2, Trash2, HelpCircle } from "lucide-react";
import type { CaretakerRule, CaretakerFaq } from "@/lib/caretaker/types";
import { createCaretakerRule, updateCaretakerRule, deleteCaretakerRule, createCaretakerFaq, updateCaretakerFaq, deleteCaretakerFaq } from "@/lib/caretaker/dashboard";
import { cn, ck, filterButtonClass } from "./caretaker-ui";

interface RulesFaqsPanelProps {
  rules: CaretakerRule[];
  faqs: CaretakerFaq[];
  propertyId: string;
  onDataChange: () => void;
}

export const RulesFaqsPanel = ({ rules, faqs, propertyId, onDataChange }: RulesFaqsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"rules" | "faqs">("rules");
  const [loading, setLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CaretakerRule | CaretakerFaq | null>(null);

  const handleCreateRule = async (data: { title: string; description: string }) => {
    setLoading("creating");
    const result = await createCaretakerRule({ ...data, property_id: propertyId });
    if (result.success) {
      setShowCreateModal(false);
      onDataChange();
    }
    setLoading(null);
  };

  const handleUpdateRule = async (id: string, data: { title: string; description: string }) => {
    setLoading(id);
    const result = await updateCaretakerRule(id, data);
    if (result.success) {
      setEditingItem(null);
      onDataChange();
    }
    setLoading(null);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this rule?")) return;
    setLoading(id);
    const result = await deleteCaretakerRule(id);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  const handleCreateFaq = async (data: { question: string; answer: string }) => {
    setLoading("creating");
    const result = await createCaretakerFaq({ ...data, property_id: propertyId });
    if (result.success) {
      setShowCreateModal(false);
      onDataChange();
    }
    setLoading(null);
  };

  const handleUpdateFaq = async (id: string, data: { question: string; answer: string }) => {
    setLoading(id);
    const result = await updateCaretakerFaq(id, data);
    if (result.success) {
      setEditingItem(null);
      onDataChange();
    }
    setLoading(null);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this FAQ?")) return;
    setLoading(id);
    const result = await deleteCaretakerFaq(id);
    if (result.success) {
      onDataChange();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={ck.display}>Rules & FAQ</h2>
        <p className={ck.body}>Maintain tenant-facing guidance, house rules, and common answers.</p>
      </div>

      {/* Tabs */}
      <div className={ck.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={filterButtonClass(activeTab === "rules")}
        >
          Property Rules ({rules.filter(r => r.is_active).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("faqs")}
          className={filterButtonClass(activeTab === "faqs")}
        >
          FAQs ({faqs.filter(f => f.is_active).length})
        </button>
      </div>

      {/* Create Button */}
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className={ck.btnManage}
      >
        <Plus className="w-4 h-4" />
        Add {activeTab === "rules" ? "Rule" : "FAQ"}
      </button>

      {/* Content */}
      {activeTab === "rules" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.filter(r => r.is_active).map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isLoading={loading === rule.id}
              isEditing={editingItem?.id === rule.id}
              onEdit={() => setEditingItem(rule)}
              onCancel={() => setEditingItem(null)}
              onUpdate={(data: { title: string; description: string }) => handleUpdateRule(rule.id, data)}
              onDelete={() => handleDeleteRule(rule.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.filter(f => f.is_active).map((faq) => (
            <FaqCard
              key={faq.id}
              faq={faq}
              isLoading={loading === faq.id}
              isEditing={editingItem?.id === faq.id}
              onEdit={() => setEditingItem(faq)}
              onCancel={() => setEditingItem(null)}
              onUpdate={(data: { question: string; answer: string }) => handleUpdateFaq(faq.id, data)}
              onDelete={() => handleDeleteFaq(faq.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeTab === "rules" && rules.filter(r => r.is_active).length === 0 && (
        <div className={ck.empty}>
          <FileText className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No rules defined yet.</p>
        </div>
      )}
      {activeTab === "faqs" && faqs.filter(f => f.is_active).length === 0 && (
        <div className={ck.empty}>
          <HelpCircle className="w-12 h-12 text-arena-on-surface-variant mx-auto mb-4" />
          <p className={ck.body}>No FAQs defined yet.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => {
            if (activeTab === "rules") {
              void handleCreateRule({ title: data.title || "", description: data.description || "" });
            } else {
              void handleCreateFaq({ question: data.question || "", answer: data.answer || "" });
            }
          }}
          loading={loading === "creating"}
        />
      )}
    </div>
  );
};

type RuleForm = { title: string; description: string };
type FaqForm = { question: string; answer: string };

interface RuleCardProps {
  rule: CaretakerRule;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (data: RuleForm) => void;
  onDelete: () => void;
}

const RuleCard = ({ rule, isLoading, isEditing, onEdit, onCancel, onUpdate, onDelete }: RuleCardProps) => {
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description || "");

  if (isEditing) {
    return (
      <div className={ck.card}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(ck.input, "w-full mb-3")}
          placeholder="Rule title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(ck.input, "w-full mb-3")}
          placeholder="Rule description"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ title, description })}
            disabled={isLoading}
            className={cn(ck.btnSuccess, "flex-1")}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(ck.btnGhost, "flex-1")}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={ck.card}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={ck.iconTile}>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-arena-on-surface">{rule.title}</h3>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-arena-surface-container-low rounded-lg text-secondary"
            aria-label="Edit rule"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading}
            className="p-2 hover:bg-error-container/30 rounded-lg text-error disabled:opacity-50"
            aria-label="Deactivate rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {rule.description && (
        <p className={cn(ck.body, "mt-3 ml-12")}>{rule.description}</p>
      )}
    </div>
  );
};

interface FaqCardProps {
  faq: CaretakerFaq;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (data: FaqForm) => void;
  onDelete: () => void;
}

const FaqCard = ({ faq, isLoading, isEditing, onEdit, onCancel, onUpdate, onDelete }: FaqCardProps) => {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);

  if (isEditing) {
    return (
      <div className={ck.card}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className={cn(ck.input, "w-full mb-3")}
          placeholder="Question"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          className={cn(ck.input, "w-full mb-3")}
          placeholder="Answer"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ question, answer })}
            disabled={isLoading}
            className={cn(ck.btnSuccess, "flex-1")}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(ck.btnGhost, "flex-1")}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={ck.card}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className={ck.iconTile}>
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-arena-on-surface">{faq.question}</h3>
            <p className={cn(ck.body, "mt-2")}>{faq.answer}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-arena-surface-container-low rounded-lg text-secondary"
            aria-label="Edit FAQ"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading}
            className="p-2 hover:bg-error-container/30 rounded-lg text-error disabled:opacity-50"
            aria-label="Deactivate FAQ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface CreateModalProps {
  type: "rules" | "faqs";
  onClose: () => void;
  onCreate: (data: Partial<RuleForm & FaqForm>) => void;
  loading: boolean;
}

const CreateModal = ({ type, onClose, onCreate, loading }: CreateModalProps) => {
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "rules") {
      onCreate({ title: field1, description: field2 });
    } else {
      onCreate({ question: field1, answer: field2 });
    }
  };

  return (
    <div className={ck.modalBackdrop}>
      <div className="caretaker-card p-6 w-full max-w-md">
        <h2 className={cn(ck.headline, "mb-4")}>
          Add {type === "rules" ? "Rule" : "FAQ"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={ck.fieldLabel}>
              {type === "rules" ? "Rule Title" : "Question"}
            </label>
            <input
              type="text"
              value={field1}
              onChange={(e) => setField1(e.target.value)}
              required
              className={cn(ck.input, "w-full")}
            />
          </div>

          <div>
            <label className={ck.fieldLabel}>
              {type === "rules" ? "Description" : "Answer"}
            </label>
            <textarea
              value={field2}
              onChange={(e) => setField2(e.target.value)}
              rows={3}
              required
              className={cn(ck.input, "w-full")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(ck.btnGhost, "flex-1")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(ck.btnSuccess, "flex-1")}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
