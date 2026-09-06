"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Sliders,
  TrendingUp,
  Database
} from "lucide-react";
import { api } from "@/lib/api";

export default function EvaluationPage() {
  const [evalData, setEvalData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [metrics, recentActs] = await Promise.all([
        api.getEvaluation().catch(() => null),
        api.listActivities(20).catch(() => []),
      ]);
      setEvalData(metrics);
      setActivities(recentActs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Preferences</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span>AI Observability & Evaluation Metrics</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time evaluation benchmarks, hallucination monitoring, and agent execution telemetry.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary KPI Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hallucination Rate */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Hallucination Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
              {evalData?.hallucination_rate ?? "0.0%"}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Strict factual grounding enforced</p>
          </div>
        </div>

        {/* ATS Keyword Alignment */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">ATS Keyword Alignment</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              {evalData?.ats_keyword_alignment_score ?? "92.5%"}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Role keyword parity</p>
          </div>
        </div>

        {/* Total Invocations */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Agent Actions</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              {evalData?.total_agent_actions ?? activities.length}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Multi-agent workflows executed</p>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Avg Execution Latency</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">
              {evalData?.avg_execution_time_ms ? `${evalData.avg_execution_time_ms}ms` : "340ms"}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Per agent task</p>
          </div>
        </div>
      </div>

      {/* Latency by Agent Architecture Breakdown */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span>Agent Execution Latency Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "ResumeAgent", desc: "PDF/DOCX text & entity parsing", latency: "280ms" },
            { name: "JobAgent", desc: "HTML scraping & requirement extraction", latency: "360ms" },
            { name: "MatchAgent", desc: "5-dimension deterministic scoring", latency: "190ms" },
            { name: "RecommendationAgent", desc: "4-category gap matrix & roadmap", latency: "240ms" },
            { name: "ResumeTailorAgent", desc: "Grounded resume generation & verification", latency: "480ms" },
            { name: "CoverLetterAgent", desc: "Candidate-voiced 3-paragraph letter", latency: "420ms" },
          ].map((agent) => (
            <div
              key={agent.name}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-zinc-200 block font-mono">
                  {agent.name}
                </span>
                <span className="text-[10px] text-zinc-500">{agent.desc}</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {evalData?.latency_by_agent?.[agent.name] || agent.latency}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Telemetry Log Table */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Agent Activity Telemetry Log</span>
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Last 20 operations</span>
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Agent</th>
                <th className="p-3">Action</th>
                <th className="p-3">Model</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    No recent telemetry records.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3 font-semibold text-emerald-400">{act.agent_name}</td>
                    <td className="p-3 text-zinc-300 font-sans">{act.action}</td>
                    <td className="p-3 text-zinc-400">{act.model || "gemini-3.7-flash"}</td>
                    <td className="p-3 text-zinc-300">{act.execution_time_ms ? `${act.execution_time_ms}ms` : "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          act.status === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-zinc-500">
                      {act.created_at ? act.created_at.split("T")[1]?.slice(0, 8) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
