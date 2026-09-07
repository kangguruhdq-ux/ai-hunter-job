"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DesktopSidebar, MobileBottomNav } from "./Navbar";
import { 
  Sparkles, 
  FileUp, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  User as UserIcon,
  LogOut
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isLandingPage = pathname === "/";
  const isPublicRoute = isLandingPage || isAuthRoute;

  // Handle route protection and redirections
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, isAuthRoute, router]);

  // Watchdog timer: If loading takes longer than 2.5s on protected route, force redirect to /login
  useEffect(() => {
    if (isLoading && !isPublicRoute) {
      const watchdog = setTimeout(() => {
        if (!isAuthenticated) {
          router.replace("/login");
        }
      }, 2500);
      return () => clearTimeout(watchdog);
    }
  }, [isLoading, isPublicRoute, isAuthenticated, router]);

  // Fetch dashboard overview stats when authenticated
  useEffect(() => {
    if (isAuthenticated && !isPublicRoute) {
      api.getDashboardStats().then(setStats).catch(() => {});
    }
  }, [isAuthenticated, isPublicRoute, pathname]);

  // If viewing landing page or auth routes, render cleanly without dashboard sidebar
  if (isPublicRoute) {
    if (isLoading && isAuthRoute) {
      return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">Memuat JobHunter AI...</p>
        </div>
      );
    }
    return <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">{children}</div>;
  }

  // Loading state for protected routes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 gap-3 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-semibold tracking-tight text-white text-lg">JobHunter AI</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Memverifikasi sesi pengguna...</span>
        </div>
        <Link
          href="/login"
          className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors mt-3 underline"
        >
          Menuju halaman login &rarr;
        </Link>
      </div>
    );
  }

  // If unauthenticated on a protected route, wait for redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        <p className="text-sm">Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  // Admin route access check
  if (pathname.startsWith("/admin") && !isAdmin) {
    return (
      <div className="flex min-h-screen bg-[#09090b] text-[#f4f4f5]">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-2xl bg-[#121215] border border-red-500/20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Akses Ditolak (403)</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Halaman Admin Command Center hanya dapat diakses oleh akun dengan peran <span className="text-purple-400 font-semibold font-mono">ADMIN</span>.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
                >
                  Kembali ke Dashboard Pengguna
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/admin")) return "Admin Command Center";
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
                {stats?.provider === "gemini" ? "Gemini 3.7 Flash" : "Google Gemini"}
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

            {/* User Badge */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-zinc-300 font-medium max-w-[120px] truncate">{user.full_name}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px]">
                    ADMIN
                  </span>
                )}
              </div>
            )}

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
