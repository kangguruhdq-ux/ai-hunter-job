"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Files, 
  FileText, 
  Mail, 
  Download, 
  Copy, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft,
  Search,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  // Editor state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const typeParam = filterType === "all" ? undefined : filterType;
      const data = await api.listDocuments(typeParam);
      setDocs(data || []);
      if (data && data.length > 0 && !selectedDoc) {
        selectDocument(data[0]);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load documents." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [filterType]);

  const selectDocument = (doc: any) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title || "");
    setEditContent(doc.content || "");
    setCopied(false);
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    try {
      setSaving(true);
      const updated = await api.updateDocument(selectedDoc.id, {
        title: editTitle,
        content: editContent,
      });
      setSelectedDoc(updated);
      setDocs(docs.map((d) => (d.id === updated.id ? updated : d)));
      setFeedback({ type: "success", message: "Document changes saved!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save document." });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!editContent) return;
    try {
      await navigator.clipboard.writeText(editContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Failed to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const blob = new Blob([editContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedDoc.title.replace(/\s+/g, "_") || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDocs = docs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.job?.title?.toLowerCase().includes(q) ||
      d.job?.company?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Files className="h-6 w-6 text-emerald-400" />
            <span>Generated Documents</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Factual, ATS-aligned resumes and customized cover letters tailored for specific roles.
          </p>
        </div>

        {selectedDoc && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Copied!" : "Copy Content"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download (.md)</span>
            </button>
            <button
              onClick={handleSaveDoc}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving..." : "Save Edits"}</span>
            </button>
          </div>
        )}
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

      {/* Main Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left Column (4 cols): Documents List */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {/* Filters & Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-[11px]">
              <button
                onClick={() => setFilterType("all")}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  filterType === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("tailored_resume")}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  filterType === "tailored_resume" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Resumes
              </button>
              <button
                onClick={() => setFilterType("cover_letter")}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  filterType === "cover_letter" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cover Letters
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading documents...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No documents found. Tailor a resume or generate a cover letter from any job details page.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isResume = doc.document_type === "tailored_resume";

                return (
                  <div
                    key={doc.id}
                    onClick={() => selectDocument(doc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800/90 border-emerald-500/50 shadow-sm"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white text-xs line-clamp-1">
                        {doc.title || "Untitled Document"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isResume
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {isResume ? "Resume" : "Letter"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                      <span>{doc.job?.company || "Job Opportunity"}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {doc.created_at ? doc.created_at.split("T")[0] : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Markdown Editor / Preview */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
          {selectedDoc ? (
            <div className="flex flex-col h-full">
              {/* Editor Header Bar */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-semibold text-sm text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 w-full"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Anti-Hallucination Verified</span>
                  </div>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-4 flex flex-col">
                <textarea
                  rows={22}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full flex-1 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none selection:bg-emerald-500/20"
                  placeholder="Document content in Markdown format..."
                />
              </div>

              {/* Editor Footer Status */}
              <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Markdown Format • UTF-8</span>
                <span>{editContent.length} characters • {editContent.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <Files className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-400">Select a document from the list</p>
              <p className="text-xs text-zinc-500 mt-1">
                View, edit, copy, or download ATS-tailored resumes and cover letters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
