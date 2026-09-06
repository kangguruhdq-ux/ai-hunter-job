"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Plus, 
  Link2, 
  Clipboard, 
  SlidersHorizontal, 
  ArrowRight, 
  Sparkles, 
  Trash2, 
  RefreshCw,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { api } from "@/lib/api";

type TabMode = "all" | "paste" | "url" | "manual";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [activeModal, setActiveModal] = useState<"paste" | "url" | "manual" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [pastedText, setPastedText] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedCompany, setPastedCompany] = useState("");

  const [importUrl, setImportUrl] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualSalary, setManualSalary] = useState("");
  const [manualType, setManualType] = useState("Full-time");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSkills, setManualSkills] = useState("");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs(search || undefined, location || undefined);
      setJobs(data || []);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load jobs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, location]);

  const handleSeedJobs = async () => {
    try {
      setSeeding(true);
      await api.seedJobs();
      setFeedback({ type: "success", message: "Seeded 4 industry sample jobs!" });
      await fetchJobs();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to seed jobs." });
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to remove this job?")) return;
    try {
      await api.deleteJob(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
      setFeedback({ type: "success", message: "Job removed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete job." });
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    try {
      setSubmitting(true);
      await api.createJobPasted({
        raw_text: pastedText,
        title: pastedTitle || undefined,
        company: pastedCompany || undefined,
      });
      setFeedback({ type: "success", message: "Job ingested and analyzed with AI!" });
      setPastedText("");
      setPastedTitle("");
      setPastedCompany("");
      setActiveModal(null);
      await fetchJobs();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to ingest pasted job." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    try {
      setSubmitting(true);
      await api.createJobUrl(importUrl);
      setFeedback({ type: "success", message: "Job scraped and parsed successfully!" });
      setImportUrl("");
      setActiveModal(null);
      await fetchJobs();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to import job from URL." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualCompany.trim() || !manualDescription.trim()) return;
    try {
      setSubmitting(true);
      const skillsArray = manualSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createJobManual({
        title: manualTitle,
        company: manualCompany,
        location: manualLocation || "Remote",
        salary_range: manualSalary || undefined,
        employment_type: manualType,
        description: manualDescription,
        required_skills: skillsArray,
      });

      setFeedback({ type: "success", message: "Job added successfully!" });
      setManualTitle("");
      setManualCompany("");
      setManualLocation("");
      setManualSalary("");
      setManualDescription("");
      setManualSkills("");
      setActiveModal(null);
      await fetchJobs();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save job." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-400" />
            <span>Job Opportunities</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Discover, ingest, and analyze target roles. Compare requirements against your candidate profile.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeedJobs}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{seeding ? "Seeding..." : "Seed 4 Sample Jobs"}</span>
          </button>

          <button
            onClick={() => setActiveModal("paste")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Clipboard className="h-3.5 w-3.5 text-blue-400" />
            <span>Paste Job</span>
          </button>

          <button
            onClick={() => setActiveModal("url")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Link2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Import URL</span>
          </button>

          <button
            onClick={() => setActiveModal("manual")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manual Entry</span>
          </button>
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by job title, company, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="relative w-full sm:w-64">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter location (e.g. Remote)..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/20">
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 space-y-3">
          <Briefcase className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Jobs Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Get started by seeding sample jobs or importing a job posting via URL or text paste.
          </p>
          <div className="pt-2">
            <button
              onClick={handleSeedJobs}
              disabled={seeding}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              Seed 4 Sample Jobs
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const reqSkills = Array.isArray(job.requirements?.required_skills)
              ? job.requirements.required_skills
              : [];

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-base"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="text-zinc-300 font-medium">{job.company}</span>
                        <span>•</span>
                        <span>{job.location || "Remote"}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteJob(job.id, e)}
                      title="Delete Job"
                      className="text-zinc-600 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Compensation & Type */}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-3 font-mono">
                    {job.salary_range && (
                      <span className="text-emerald-400">{job.salary_range}</span>
                    )}
                    {job.employment_type && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize text-[11px]">
                        {job.employment_type}
                      </span>
                    )}
                  </div>

                  {/* Skills preview */}
                  {reqSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {reqSkills.slice(0, 5).map((sk: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300"
                        >
                          {sk}
                        </span>
                      ))}
                      {reqSkills.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-zinc-500">
                          +{reqSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    Source: {job.source_type || "manual"}
                  </span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600"
                  >
                    <span>Match & Tailor</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paste Job Modal */}
      {activeModal === "paste" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clipboard className="h-4 w-4 text-blue-400" />
                <span>Paste Job Description</span>
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Company (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe"
                    value={pastedCompany}
                    onChange={(e) => setPastedCompany(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Job Description Text <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste the full job posting text here. AI will extract requirements, skills, experience, and responsibilities..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !pastedText.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{submitting ? "Analyzing Job..." : "Extract & Save Job"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* URL Import Modal */}
      {activeModal === "url" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Link2 className="h-4 w-4 text-purple-400" />
                <span>Import Job from URL</span>
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Enter any public careers page URL. Our respectful scraper extracts clean article content and structures requirements using AI.
            </p>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Job Posting URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://boards.greenhouse.io/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !importUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{submitting ? "Scraping & Parsing..." : "Import Job"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {activeModal === "manual" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>Manual Job Entry</span>
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Staff Backend Engineer"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">
                    Company <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Datadog"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Location</label>
                  <input
                    type="text"
                    placeholder="Remote / New York"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Salary Range</label>
                  <input
                    type="text"
                    placeholder="$160,000 - $200,000"
                    value={manualSalary}
                    onChange={(e) => setManualSalary(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Type</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Go, Kubernetes, Kafka, Distributed Systems"
                  value={manualSkills}
                  onChange={(e) => setManualSkills(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400">
                  Job Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Responsibilities, requirements, and team description..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
