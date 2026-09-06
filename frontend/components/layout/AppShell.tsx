"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileBottomNav } from "./Navbar";
import { 
  Sparkles, 
  Cpu, 
  FileUp, 
  PlusCircle, 
  KanbanSquare, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Attempt to load stats to display active provider & quick counts
    api.getDashboardStats().then(setStats).catch(() => {});
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/resume")) return "Resume & Profile";
    if (pathname.startsWith("/jobs/")) return "Job Intelligence";
    if (pathname.startsWith("/jobs")) return "Job Discovery";
    if (pathname.startsWith("/applications")) return "Application Tracker";
    if (pathname.startsWith("/documents")) return "Generated Documents";
    if (pathname.startsWith("/settings/evaluation")) return "AI Observability & Metrics";
    if (pathname.startsWith("/settings")) return "Candidate Preferences";
    return "JobHunter AI";
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#f4f4f5]">
      {/* Sidebar for Desktop */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#0c0c0e]/80 px-4 md:px-8 backdrop-blur-md">
          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="font-semibold text-white tracking-tight">JobHunter AI</span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
            <span className="font-medium text-zinc-200">{getPageTitle()}</span>
          </div>

          {/* Quick Stats & Actions */}
          <div className="flex items-center gap-3">
            {/* AI Provider Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-400">Provider:</span>
              <span className="font-mono text-emerald-400 font-medium">
                {stats?.provider === "gemini" ? "Gemini 3.7 Flash" : "Local AI Provider"}
              </span>
            </div>

            {/* Anti-hallucination shield indicator */}
            <div 
              title="Strict Anti-Hallucination Guardrails Active: All generated resumes and cover letters are strictly grounded in verified candidate data."
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium cursor-help"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Grounding Guard</span>
            </div>

            {/* Quick Action Button */}
            <Link
              href="/resume"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Upload Resume</span>
              <span className="xs:hidden">Upload</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
