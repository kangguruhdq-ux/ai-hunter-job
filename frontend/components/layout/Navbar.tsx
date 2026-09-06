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
  Activity,
  ShieldCheck,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/resume", label: "Resume", icon: FileText },
    { href: "/jobs", label: "Job Board", icon: Briefcase },
    { href: "/applications", label: "Tracker", icon: KanbanSquare },
    { href: "/documents", label: "Documents", icon: Files },
    { href: "/settings", label: "Preferences", icon: Settings },
    { href: "/settings/evaluation", label: "AI Metrics", icon: Activity },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck, badge: "ADMIN" }] : []),
  ];

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
        {navItems.map((item) => {
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
              <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : (item.href === "/admin" ? "text-purple-400" : "text-zinc-400"))} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-3 mt-auto">
        {user && (
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs flex-shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
                  {isAdmin && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar / Logout"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* System Mode Indicator */}
        <div className="px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">Engine</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const mobileNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/resume", label: "Resume", icon: FileText },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/applications", label: "Tracker", icon: KanbanSquare },
    ...(isAdmin 
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : [{ href: "/documents", label: "Docs", icon: Files }]
    ),
  ];

  return (
    <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {mobileNav.map((item) => {
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
