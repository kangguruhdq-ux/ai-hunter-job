"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  KanbanSquare, 
  Files, 
  Settings, 
  Sparkles,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/applications", label: "Tracker", icon: KanbanSquare },
  { href: "/documents", label: "Documents", icon: Files },
  { href: "/settings", label: "Preferences", icon: Settings },
  { href: "/settings/evaluation", label: "AI Metrics", icon: Activity },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#0c0c0e] min-h-screen p-4 flex-shrink-0">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-3 mb-6 group">
        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
          <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div>
          <span className="font-semibold tracking-tight text-white flex items-center gap-1.5 text-base">
            JobHunter <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">AI</span>
          </span>
          <p className="text-[11px] text-zinc-400">Autonomous Career Agent</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/settings");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-zinc-400")} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Mode Indicator */}
      <div className="pt-4 border-t border-zinc-800/80 mt-auto">
        <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-zinc-300 font-medium">Agent Engine</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">ONLINE</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
              isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
