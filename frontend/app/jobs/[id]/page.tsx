"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  Sparkles, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Mail, 
  KanbanSquare, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  BookOpen,
  Target,
  Layers,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [skillGap, setSkillGap] = useState<any>(null);
  const [tailoredResume, setTailoredResume] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [calculatingMatch, setCalculatingMatch] = useState(false);
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [tailoringResume, setTailoringResume] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const [jobData, matchData, gapData, trDoc, clDoc] = await Promise.all([
        api.getJob(jobId).catch(() => null),
        api.getJobMatch(jobId).catch(() => null),
        api.getSkillGapAnalysis(jobId).catch(() => null),
        api.getLatestTailoredResume(jobId).catch(() => null),
        api.getLatestCoverLetter(jobId).catch(() => null),
      ]);

      setJob(jobData);
      setMatch(matchData);
      setSkillGap(gapData);
      setTailoredResume(trDoc);
      setCoverLetter(clDoc);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load job details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const handleCalculateMatch = async () => {
    try {
      setCalculatingMatch(true);
      const res = await api.calculateMatch(jobId);
      setMatch(res);
      setFeedback({ type: "success", message: `Match score calculated: ${res.overall_score}%` });
      // Also refresh skill gap if available
      const gapRes = await api.getSkillGapAnalysis(jobId).catch(() => null);
      if (gapRes) setSkillGap(gapRes);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to calculate match score." });
    } finally {
      setCalculatingMatch(false);
    }
  };

  const handleTailorResume = async () => {
    try {
      setTailoringResume(true);
      const res = await api.generateTailoredResume(jobId);
      setTailoredResume(res);
      setFeedback({ type: "success", message: "Tailored resume generated with strict factual grounding!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to tailor resume." });
    } finally {
      setTailoringResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    try {
      setGeneratingLetter(true);
      const res = await api.generateCoverLetter(jobId);
      setCoverLetter(res);
      setFeedback({ type: "success", message: "Authentic, grounded cover letter generated!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to generate cover letter." });
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleAddToTracker = async () => {
    try {
      await api.createApplication({
        job_id: jobId,
        status: "Applied",
        notes: `Applied via JobHunter AI. Overall Match: ${match?.overall_score || 0}%`,
      });
      setFeedback({ type: "success", message: "Added to Application Tracker (Status: Applied)!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to add to tracker." });
    }
  };

  const handleRunFullPipeline = async () => {
    try {
      setRunningPipeline(true);
      setFeedback({ type: "success", message: "Running full agent pipeline: Matching -> Skill Gap -> Tailored Resume -> Cover Letter -> Application Tracking..." });
      const res = await api.runPipeline(jobId);
      setMatch(res.match);
      setSkillGap(res.skill_gap);
      setTailoredResume(res.tailored_resume);
      setCoverLetter(res.cover_letter);
      setFeedback({ type: "success", message: "Full autonomous pipeline completed successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to run pipeline." });
    } finally {
      setRunningPipeline(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-rose-400 border-rose-500/40 bg-rose-500/10";
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/20">
        Loading job intelligence...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-12 text-center border border-zinc-800 rounded-xl bg-zinc-900/20 space-y-4">
        <h2 className="text-lg font-semibold text-white">Job not found</h2>
        <Link href="/jobs" className="text-xs text-emerald-400 hover:underline">
          Return to Jobs Board
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button & top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </Link>

        {/* 1-Click Master Pipeline Button */}
        <button
          onClick={handleRunFullPipeline}
          disabled={runningPipeline}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          <span>{runningPipeline ? "Running Autonomous Pipeline..." : "Run Full AI Pipeline (1-Click)"}</span>
        </button>
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

      {/* Job Overview Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-white">{job.title}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                {job.company}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
              <span>{job.location || "Remote"}</span>
              <span>•</span>
              <span className="capitalize">{job.employment_type || "Full-time"}</span>
              {job.salary_range && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-medium">{job.salary_range}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleCalculateMatch}
              disabled={calculatingMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>{calculatingMatch ? "Scoring..." : match ? "Re-calculate Match" : "Calculate Match"}</span>
            </button>

            <button
              onClick={handleTailorResume}
              disabled={tailoringResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <span>{tailoringResume ? "Tailoring..." : tailoredResume ? "Re-tailor Resume" : "Tailor Resume"}</span>
            </button>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={generatingLetter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5 text-purple-400" />
              <span>{generatingLetter ? "Writing..." : coverLetter ? "Re-generate Letter" : "Cover Letter"}</span>
            </button>

            <button
              onClick={handleAddToTracker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              <span>Track Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Match Score & Explainability Section (Section 15, 16) */}
      {match ? (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <span>Deterministic Compatibility Score</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculated strictly from your candidate profile and extracted job requirements.
              </p>
            </div>

            <div className={`px-4 py-2 rounded-2xl border text-xl font-bold font-mono ${getScoreColor(match.overall_score)}`}>
              {match.overall_score}% Match
            </div>
          </div>

          {/* 5-Dimension Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">Skills (40%)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {match.breakdown?.skills_score ?? match.skills_score ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">Experience (25%)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {match.breakdown?.experience_score ?? match.experience_score ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">Responsibilities (20%)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {match.breakdown?.responsibilities_score ?? match.responsibilities_score ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">Education (10%)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {match.breakdown?.education_score ?? match.education_score ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Keywords (5%)</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {match.breakdown?.keywords_score ?? match.keywords_score ?? 0}%
              </span>
            </div>
          </div>

          {/* Explanation Text */}
          {match.explanation && (
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-white block mb-1">AI Match Summary:</span>
              {match.explanation}
            </div>
          )}

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Key Candidate Strengths</span>
              </span>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                {Array.isArray(match.pros) && match.pros.length > 0 ? (
                  match.pros.map((pro: string, idx: number) => <li key={idx}>{pro}</li>)
                ) : (
                  <li>Strong technical foundation aligned with job requirements</li>
                )}
              </ul>
            </div>

            {/* Areas of Hesitation / Gaps */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Areas to Address</span>
              </span>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                {Array.isArray(match.cons) && match.cons.length > 0 ? (
                  match.cons.map((con: string, idx: number) => <li key={idx}>{con}</li>)
                ) : (
                  <li>Review preparation roadmap to address specific skill nuances</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-3">
          <TrendingUp className="h-8 w-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Match Calculated Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Run compatibility analysis to see how your experience ranks against this job's 5 key evaluation criteria.
          </p>
          <button
            onClick={handleCalculateMatch}
            disabled={calculatingMatch}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
          >
            {calculatingMatch ? "Scoring..." : "Calculate Compatibility Now"}
          </button>
        </div>
      )}

      {/* 4-Category Skill Gap Matrix (Section 17, 18) */}
      {skillGap && (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                <span>4-Category Skill Gap Matrix</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Precise classification of required skills and your proficiency readiness
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category 1: Already Strong */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                <span>Already Strong</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">
                  {skillGap.already_strong?.length || 0}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.isArray(skillGap.already_strong) && skillGap.already_strong.length > 0 ? (
                  skillGap.already_strong.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">None identified</span>
                )}
              </div>
            </div>

            {/* Category 2: Some Experience */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <span className="text-xs font-semibold text-blue-400 flex items-center justify-between">
                <span>Some Experience</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20">
                  {skillGap.some_experience?.length || 0}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.isArray(skillGap.some_experience) && skillGap.some_experience.length > 0 ? (
                  skillGap.some_experience.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">None identified</span>
                )}
              </div>
            </div>

            {/* Category 3: Needs Improvement */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                <span>Needs Improvement</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">
                  {skillGap.needs_improvement?.length || 0}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.isArray(skillGap.needs_improvement) && skillGap.needs_improvement.length > 0 ? (
                  skillGap.needs_improvement.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">None identified</span>
                )}
              </div>
            </div>

            {/* Category 4: Missing */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <span className="text-xs font-semibold text-rose-400 flex items-center justify-between">
                <span>Missing</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20">
                  {skillGap.missing?.length || 0}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.isArray(skillGap.missing) && skillGap.missing.length > 0 ? (
                  skillGap.missing.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">None identified</span>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Learning Roadmap & Interview Focus */}
          {Array.isArray(skillGap.actionable_roadmap) && skillGap.actionable_roadmap.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span>Actionable Preparation Roadmap</span>
              </h3>
              <div className="space-y-2">
                {skillGap.actionable_roadmap.map((step: any, sIdx: number) => (
                  <div key={sIdx} className="text-xs text-zinc-300 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-zinc-800 text-emerald-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                      {sIdx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-zinc-200">
                        {step.skill || step.topic || `Step ${sIdx + 1}`}:
                      </span>{" "}
                      <span>{step.action || step.description || JSON.stringify(step)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Documents Quick Access */}
      {(tailoredResume || coverLetter) && (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span>Tailored Application Documents</span>
            </h2>
            <Link
              href="/documents"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Manage in Document Center</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tailoredResume && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Tailored Resume</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Grounded
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  ATS-optimized resume structured specifically for {job.title} at {job.company}.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/documents`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700"
                  >
                    View & Edit Markdown
                  </Link>
                </div>
              </div>
            )}

            {coverLetter && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-purple-400" />
                    <span>AI Cover Letter</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                    3-Paragraph
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  Authentic, candidate-voiced letter addressing {job.company}'s specific challenges.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/documents`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700"
                  >
                    View & Edit Markdown
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw Job Description Accordion / Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-zinc-400" />
          <span>Job Description & Requirements</span>
        </h2>
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {job.description || "No full description text available."}
        </div>
      </div>
    </div>
  );
}
