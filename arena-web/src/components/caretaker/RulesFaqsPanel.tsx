"use client";

import React, { useState } from "react";
import { FileText, Plus, Edit2, Trash2, HelpCircle, Check } from "lucide-react";
import type { CaretakerRule, CaretakerFaq } from "@/lib/caretaker/types";
import { createCaretakerRule, updateCaretakerRule, deleteCaretakerRule, createCaretakerFaq, updateCaretakerFaq, deleteCaretakerFaq } from "@/lib/caretaker/dashboard";

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
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab("rules")}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === "rules"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Property Rules ({rules.filter(r => r.is_active).length})
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === "faqs"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          FAQs ({faqs.filter(f => f.is_active).length})
        </button>
      </div>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
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
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No rules defined yet.</p>
        </div>
      )}
      {activeTab === "faqs" && faqs.filter(f => f.is_active).length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No FAQs defined yet.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onCreate={activeTab === "rules" ? handleCreateRule : handleCreateFaq}
          loading={loading === "creating"}
        />
      )}
    </div>
  );
};

const RuleCard = ({ rule, isLoading, isEditing, onEdit, onCancel, onUpdate, onDelete }: any) => {
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description || "");

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-3"
          placeholder="Rule title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-3"
          placeholder="Rule description"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ title, description })}
            disabled={isLoading}
            className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{rule.title}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {rule.description && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 ml-11">{rule.description}</p>
      )}
    </div>
  );
};

const FaqCard = ({ faq, isLoading, isEditing, onEdit, onCancel, onUpdate, onDelete }: any) => {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-3"
          placeholder="Question"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-3"
          placeholder="Answer"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ question, answer })}
            disabled={isLoading}
            className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{faq.answer}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateModal = ({ type, onClose, onCreate, loading }: any) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Add {type === "rules" ? "Rule" : "FAQ"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === "rules" ? "Rule Title" : "Question"}
            </label>
            <input
              type="text"
              value={field1}
              onChange={(e) => setField1(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === "rules" ? "Description" : "Answer"}
            </label>
            <textarea
              value={field2}
              onChange={(e) => setField2(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
