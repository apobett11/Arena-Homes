"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Phone, 
    Mail, 
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Search,
    Filter
} from "lucide-react";
import { ApplicationApi } from "@/lib/api/domains/applications";

interface Application {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    universityRegNo?: string;
    message?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    preferredMoveInDate?: string;
    createdAt: string;
    caretakerNotes?: string;
}

export const ApplicationManager = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        async function loadApplications() {
            try {
                const data = await ApplicationApi.getCaretakerApplications();
                setApplications(data);
            } catch (error) {
                console.error("Failed to load applications", error);
                setApplications([]);
            } finally {
                setLoading(false);
            }
        }

        loadApplications();
    }, []);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await ApplicationApi.respond(id, { status: "APPROVED", notes });
            setApplications(prev => prev.map(app =>
                app.id === id
                    ? { ...app, status: 'APPROVED', caretakerNotes: notes }
                    : app
            ));
            setNotes("");
            setExpandedId(null);
        } catch (error) {
            console.error("Failed to approve application", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await ApplicationApi.respond(id, { status: "REJECTED", notes });
            setApplications(prev => prev.map(app =>
                app.id === id
                    ? { ...app, status: 'REJECTED', caretakerNotes: notes }
                    : app
            ));
            setNotes("");
            setExpandedId(null);
        } catch (error) {
            console.error("Failed to reject application", error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredApps = applications.filter(app => 
        filter === 'ALL' ? true : app.status === filter
    );

    const stats = {
        pending: applications.filter(a => a.status === 'PENDING').length,
        approved: applications.filter(a => a.status === 'APPROVED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
        total: applications.length,
    };

    if (loading) {
        return (
            <div className="glass rounded-3xl p-8 border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/40 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/40 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Tenant Applications
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Review and manage incoming applications
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs">
                        <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                            {stats.pending} Pending
                        </span>
                        <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                            {stats.approved} Approved
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filter === f
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {f === 'ALL' ? 'All Applications' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Applications List */}
            <div className="space-y-3">
                {filteredApps.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Users size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No {filter.toLowerCase()} applications found</p>
                    </div>
                ) : (
                    filteredApps.map((app) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-xl overflow-hidden ${
                                app.status === 'PENDING'
                                    ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10'
                                    : app.status === 'APPROVED'
                                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10'
                                    : 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10'
                            }`}
                        >
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {app.fullName}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                app.status === 'PENDING'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    : app.status === 'APPROVED'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Mail size={12} />
                                                {app.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={12} />
                                                {app.phoneNumber}
                                            </span>
                                            {app.whatsappNumber && (
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare size={12} />
                                                    WhatsApp
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                        {expandedId === app.id ? (
                                            <ChevronUp size={18} className="text-slate-400" />
                                        ) : (
                                            <ChevronDown size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedId === app.id && app.status === 'PENDING' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-200 dark:border-slate-700/50"
                                    >
                                        <div className="p-4 space-y-4">
                                            {app.universityRegNo && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Reg No:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-white">{app.universityRegNo}</span>
                                                </div>
                                            )}
                                            {app.preferredMoveInDate && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Move-in Date:</span>{' '}
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {new Date(app.preferredMoveInDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {app.message && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Message:</span>
                                                    <p className="mt-1 text-slate-700 dark:text-slate-300 italic">
                                                        &quot;{app.message}&quot;
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Notes (optional)
                                                </label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Add notes about this applicant..."
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary resize-none"
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={actionLoading === app.id}
                                                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === app.id ? (
                                                        <span className="animate-spin">⌛</span>
                                                    ) : (
                                                        <CheckCircle size={16} />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(app.id)}
                                                    disabled={actionLoading === app.id}
                                                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === app.id ? (
                                                        <span className="animate-spin">⌛</span>
                                                    ) : (
                                                        <XCircle size={16} />
                                                    )}
                                                    Reject
                                                </button>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                                On approval, an account will be created and credentials sent to {app.email}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {expandedId === app.id && app.status !== 'PENDING' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-200 dark:border-slate-700/50 p-4"
                                    >
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">Notes:</span>{' '}
                                            {app.caretakerNotes || 'No notes added'}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
