"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  KanbanSquare, 
  LayoutList, 
  Plus, 
  Calendar, 
  DollarSign, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";

const STAGES = [
  { id: "Wishlist", label: "Wishlist", color: "border-zinc-700 bg-zinc-800/40 text-zinc-300" },
  { id: "Applied", label: "Applied", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  { id: "Screening", label: "Screening", color: "border-purple-500/40 bg-purple-500/10 text-purple-400" },
  { id: "Interview", label: "Interview", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  { id: "Technical Interview", label: "Tech Interview", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" },
  { id: "Final Interview", label: "Final Round", color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400" },
  { id: "Offer", label: "Offer Received", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  { id: "Rejected", label: "Archived / Rejected", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
];

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [kanbanData, setKanbanData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [editingModal, setEditingModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editInterviewDate, setEditInterviewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchKanban = async () => {
    try {
      setLoading(true);
      const data = await api.getKanban(true);
      setKanbanData(data || []);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load applications." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanban();
  }, []);

  const handleOpenEdit = (app: any) => {
    setSelectedApp(app);
    setEditStatus(app.status || "Applied");
    setEditNotes(app.notes || "");
    setEditSalary(app.salary_offered ? String(app.salary_offered) : "");
    setEditInterviewDate(app.interview_date ? app.interview_date.split("T")[0] : "");
    setEditingModal(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      setSaving(true);
      await api.updateApplication(selectedApp.id, {
        status: editStatus,
        notes: editNotes,
        salary_offered: editSalary ? parseFloat(editSalary) : undefined,
        interview_date: editInterviewDate || undefined,
      });
      setFeedback({ type: "success", message: "Application updated successfully!" });
      setEditingModal(false);
      await fetchKanban();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update application." });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMove = async (appId: string, currentStatus: string, direction: "next" | "prev") => {
    const currentIdx = STAGES.findIndex((s) => s.id === currentStatus);
    if (currentIdx === -1) return;

    const newIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;

    const newStatus = STAGES[newIdx].id;
    try {
      await api.updateApplication(appId, { status: newStatus });
      await fetchKanban();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to advance application stage." });
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.deleteApplication(appId);
      setFeedback({ type: "success", message: "Application deleted." });
      if (selectedApp?.id === appId) setEditingModal(false);
      await fetchKanban();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete application." });
    }
  };

  const totalApplications = kanbanData.reduce(
    (acc, col) => acc + (col.applications?.length || col.items?.length || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-emerald-400" />
            <span>Application Lifecycle Tracker</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track your job hunt progress across all 8 stages from Wishlist to Offer.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <Link
            href="/jobs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add from Jobs</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/20">
          Loading applications...
        </div>
      ) : totalApplications === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 space-y-3">
          <KanbanSquare className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Active Applications</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Browse discovered jobs and click "Track Job" or "Run Full AI Pipeline" to add entries here.
          </p>
          <div className="pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
            >
              <span>Explore Jobs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        /* 8-Column Kanban Board with Smooth Horizontal Scrolling */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[600px]">
          {STAGES.map((col) => {
            const colData = kanbanData.find((c) => c.status === col.id);
            const items = colData?.applications || colData?.items || [];

            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-3 max-h-[750px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${col.color}`}>
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{items.length}</span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-zinc-600 border border-dashed border-zinc-800/60 rounded-lg">
                      No jobs
                    </div>
                  ) : (
                    items.map((app: any) => {
                      const job = app.job || {};
                      const stageIdx = STAGES.findIndex((s) => s.id === col.id);

                      return (
                        <div
                          key={app.id}
                          onClick={() => handleOpenEdit(app)}
                          className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white text-xs group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {job.title || "Posisi Terdaftar"}
                              </span>
                            </div>
                            {job.company && (
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {job.company}
                              </p>
                            )}

                            {/* Extra Info Pills */}
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-2 flex-wrap">
                              {app.interview_date && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Calendar className="h-3 w-3" />
                                  <span>{app.interview_date.split("T")[0]}</span>
                                </span>
                              )}
                              {app.salary_offered && (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${app.salary_offered.toLocaleString()}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Prev Stage, Edit, Next Stage */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/80 text-zinc-500"
                          >
                            <button
                              disabled={stageIdx === 0}
                              onClick={() => handleQuickMove(app.id, col.id, "prev")}
                              className="p-1 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                              title="Move back"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(app)}
                              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800"
                            >
                              Details
                            </button>

                            <button
                              disabled={stageIdx === STAGES.length - 1}
                              onClick={() => handleQuickMove(app.id, col.id, "next")}
                              className="p-1 hover:text-emerald-400 disabled:opacity-20 transition-colors"
                              title="Advance stage"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Role & Company</th>
                <th className="p-4">Current Stage</th>
                <th className="p-4">Interview Date</th>
                <th className="p-4">Salary Offer</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {kanbanData.flatMap((c) => c.applications || c.items || []).map((app: any) => {
                const job = app.job || {};
                const stage = STAGES.find((s) => s.id === app.status) || STAGES[1];

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                    onClick={() => handleOpenEdit(app)}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-white">{job.title || "Posisi Terdaftar"}</div>
                      {job.company ? (
                        <div className="text-zinc-400 text-[11px]">{job.company}</div>
                      ) : (
                        <div className="text-zinc-600 text-[11px] italic">Perusahaan tidak dicantumkan</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      {app.interview_date ? app.interview_date.split("T")[0] : "—"}
                    </td>
                    <td className="p-4 text-emerald-400 font-mono">
                      {app.salary_offered ? `$${app.salary_offered.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-4 text-zinc-500 font-mono">
                      {app.applied_date ? app.applied_date.split("T")[0] : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(app);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Application Modal */}
      {editingModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {selectedApp.job?.title || "Posisi Terdaftar"}
                </h2>
                {selectedApp.job?.company && (
                  <p className="text-xs text-zinc-400">
                    {selectedApp.job.company}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApp} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">Lifecycle Stage</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Interview Date</label>
                  <input
                    type="date"
                    value={editInterviewDate}
                    onChange={(e) => setEditInterviewDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Salary Offered ($)</label>
                  <input
                    type="number"
                    placeholder="185000"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400">Notes & Reflection</label>
                <textarea
                  rows={4}
                  placeholder="Notes from recruiter screen, coding challenge questions, interview feedback..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => handleDeleteApp(selectedApp.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
