"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  Sparkles,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [targetTitles, setTargetTitles] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [locations, setLocations] = useState("");
  const [remotePref, setRemotePref] = useState("remote");
  const [industries, setIndustries] = useState("");
  const [excludedCompanies, setExcludedCompanies] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const data = await api.getPreferences();
        if (data) {
          setTargetTitles(Array.isArray(data.target_roles) ? data.target_roles.join(", ") : "");
          setMinSalary(data.min_salary ? String(data.min_salary) : "");
          setLocations(Array.isArray(data.target_locations) ? data.target_locations.join(", ") : "");
          setRemotePref(data.remote_preference || "remote");
          setIndustries(Array.isArray(data.industries) ? data.industries.join(", ") : "");
          setExcludedCompanies(Array.isArray(data.excluded_companies) ? data.excluded_companies.join(", ") : "");
          setCustomInstructions(data.custom_instructions || "");
        }
      } catch (err: any) {
        // No preferences stored yet is fine
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const toArray = (str: string) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      await api.updatePreferences({
        target_roles: toArray(targetTitles),
        min_salary: minSalary ? parseFloat(minSalary) : undefined,
        target_locations: toArray(locations),
        remote_preference: remotePref,
        industries: toArray(industries),
        excluded_companies: toArray(excludedCompanies),
        custom_instructions: customInstructions,
      });

      setFeedback({ type: "success", message: "Candidate preferences and AI memory updated!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-400" />
            <span>Candidate Preferences & AI Memory</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure your career goals. The AI agents use these persistent preferences to bias recommendations and tailor documents.
          </p>
        </div>

        <Link
          href="/settings/evaluation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors shrink-0"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>View AI Metrics</span>
        </Link>
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

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Role & Compensation */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <span>Target Roles & Compensation</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">
                Target Roles / Titles (comma separated)
              </label>
              <input
                type="text"
                placeholder="Senior Backend Engineer, Staff Engineer, Distributed Systems Engineer"
                value={targetTitles}
                onChange={(e) => setTargetTitles(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">
                Desired Minimum Salary ($ USD/year)
              </label>
              <input
                type="number"
                placeholder="160000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Location & Remote Preferences */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span>Location & Work Model</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">Workplace Flexibility</label>
              <select
                value={remotePref}
                onChange={(e) => setRemotePref(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid Allowed</option>
                <option value="onsite">On-Site OK</option>
                <option value="any">Any / Flexible</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">
                Target Locations (comma separated)
              </label>
              <input
                type="text"
                placeholder="San Francisco, New York, Seattle, Austin"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Industry & Company Exclusions */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-purple-400" />
            <span>Target Industries & Blacklist</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">
                Preferred Industries (comma separated)
              </label>
              <input
                type="text"
                placeholder="FinTech, Developer Tools, AI / ML Infrastructure"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">
                Excluded Companies (comma separated)
              </label>
              <input
                type="text"
                placeholder="Current Employer, Specific competitors..."
                value={excludedCompanies}
                onChange={(e) => setExcludedCompanies(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Instructions / AI Memory Prompt */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Custom Instructions for AI Tailoring</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Tell the AI which strengths or project themes to emphasize across tailored resumes and cover letters (e.g. latency tuning, large-scale cloud migration, mentoring junior engineers).
          </p>
          <textarea
            rows={4}
            placeholder="e.g. Always emphasize my experience with high-throughput distributed systems and Kubernetes infrastructure. Mention my contribution to reducing latency by 40%."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Preferences..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
