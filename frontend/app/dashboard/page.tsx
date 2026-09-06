"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  FileText, 
  KanbanSquare, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  UploadCloud, 
  Plus, 
  RefreshCw,
  Zap,
  Activity,
  Award,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashStats, ranked, recentActivities] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getRecommendedRanked(5).catch(() => []),
        api.listActivities(8).catch(() => []),
      ]);

      setStats(dashStats);
      setRecommendedJobs(ranked || []);
      setActivities(recentActivities || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedJobs = async () => {
    try {
      setSeeding(true);
      await api.seedJobs();
      await loadData();
    } catch (err: any) {
      alert("Error seeding jobs: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/40 to-zinc-900/90 border border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Career Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome to JobHunter AI
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-xl">
            Upload your resume, analyze high-match jobs, tailor ATS-optimized applications without hallucination, and track every interview stage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={handleSeedJobs}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>{seeding ? "Seeding..." : "Seed 4 Sample Jobs"}</span>
          </button>
          <Link
            href="/resume"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Resume</span>
          </Link>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Applications */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Applications</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <KanbanSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white">
              {stats?.active_applications ?? 0}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">In review or interview stages</p>
          </div>
        </div>

        {/* Total Tracked Jobs */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tracked Jobs</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white">
              {stats?.total_jobs ?? 0}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Ingested & analyzed</p>
          </div>
        </div>

        {/* Tailored Resumes */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tailored Resumes</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white">
              {stats?.resumes_tailored ?? 0}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Factual & grounded</p>
          </div>
        </div>

        {/* Avg Compatibility */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Avg Compatibility</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white">
              {stats?.avg_match_score ? `${stats.avg_match_score}%` : "—"}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Across analyzed roles</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recommended Jobs & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Top Recommended Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <span>Top Recommended Opportunities</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ranked by 5-dimension deterministic match scoring
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>View all ({stats?.total_jobs ?? 0})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center border border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500 text-sm">
              Analyzing opportunities...
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <Briefcase className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium">No jobs matched yet</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Seed sample jobs or upload a resume to calculate compatibility.
              </p>
              <button
                onClick={handleSeedJobs}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Seed Sample Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedJobs.map((item) => {
                const job = item.job || item;
                const score = item.overall_score ?? item.match_score ?? 0;
                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {job.title}
                        </span>
                        <span className="text-xs text-zinc-400">at</span>
                        <span className="text-xs font-medium text-zinc-300 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/50">
                          {job.company}
                        </span>
                        {job.location && (
                          <span className="text-xs text-zinc-500">{job.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                        {job.employment_type && (
                          <span className="capitalize">{job.employment_type}</span>
                        )}
                        {job.salary_range && (
                          <span className="text-emerald-400/90 font-mono">{job.salary_range}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {score > 0 && (
                        <div
                          className={`px-2.5 py-1 rounded-full border text-xs font-bold font-mono ${getScoreColor(
                            score
                          )}`}
                        >
                          {score}% Match
                        </div>
                      )}
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1 transition-all"
                      >
                        <span>Analyze & Apply</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Live AI Agent Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white tracking-tight">
                AI Agent Observability
              </h2>
            </div>
            <button
              onClick={loadData}
              title="Refresh live activity"
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs text-zinc-400">
              <span>Agent Event</span>
              <span>Latency / Status</span>
            </div>

            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No recent agent events. Perform an upload or match to see live telemetry.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-xs flex flex-col gap-1 hover:border-zinc-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">
                        {act.agent_name || "Agent"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          act.status === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <p className="text-zinc-400 text-[11px] truncate">
                      {act.action}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                      <span>{act.model || "gemini"}</span>
                      {act.execution_time_ms ? (
                        <span>{act.execution_time_ms}ms</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800/80">
              <Link
                href="/settings/evaluation"
                className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center justify-between py-1 transition-colors"
              >
                <span>View Full AI Metrics & Telemetry</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
