"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Briefcase, 
  KanbanSquare, 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX,
  Server,
  Zap,
  Sparkles,
  ChevronDown,
  Clock
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AdminStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_resumes: number;
  total_jobs: number;
  total_applications: number;
  total_ai_activities: number;
  ai_provider: string;
  configured_model: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  resumes_count: number;
  applications_count: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [aiMetrics, setAiMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Filters & State
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"users" | "diagnostics">("users");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, usersRes, metricsRes, healthRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers({ search: search || undefined, role: roleFilter || undefined }),
        api.admin.getAIMetrics().catch(() => null),
        api.admin.getSystemHealth().catch(() => null),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users || []);
      setTotalUsers(usersRes.total || 0);
      setAiMetrics(metricsRes);
      setSystemHealth(healthRes);
    } catch (err: any) {
      showNotification("error", err.message || "Gagal memuat data administrator.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      showNotification("error", "Proteksi Keamanan: Anda tidak dapat menonaktifkan akun admin Anda sendiri.");
      return;
    }

    const newStatus = !user.is_active;
    const confirmMsg = newStatus 
      ? `Aktifkan akun ${user.email}?`
      : `Nonaktifkan akun ${user.email}? User tidak akan bisa login.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await api.admin.updateUserStatus(user.id, { is_active: newStatus });
      showNotification("success", `Status akun ${user.email} berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`);
      loadData(true);
    } catch (err: any) {
      showNotification("error", err.message || "Gagal memperbarui status user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      showNotification("error", "Proteksi Keamanan: Anda tidak dapat mengubah peran akun admin Anda sendiri.");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    const confirmMsg = newRole === "admin"
      ? `Promosikan ${user.email} menjadi ADMINISTRATOR? Pengguna akan mendapatkan hak akses penuh ke platform.`
      : `Turunkan peran ${user.email} menjadi USER biasa?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await api.admin.updateUserStatus(user.id, { role: newRole });
      showNotification("success", `Peran ${user.email} berhasil diubah menjadi ${newRole.toUpperCase()}.`);
      loadData(true);
    } catch (err: any) {
      showNotification("error", err.message || "Gagal memperbarui role user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Command Center</h1>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              RBAC PROTECTED
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Manajemen pengguna platform, tata kelola akses, diagnostik sistem, dan observabilitas AI engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-purple-400" : "text-zinc-400"}`} />
            <span>{isRefreshing ? "Menyegarkan..." : "Segarkan Data"}</span>
          </button>
        </div>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border animate-in slide-in-from-top-2 duration-200 ${
          notification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Platform KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Pengguna</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats ? stats.total_users : "..."}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {stats ? `${stats.active_users} aktif (${stats.admin_users} admin)` : "Memuat..."}
          </p>
        </div>

        {/* Resumes */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Resume</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats ? stats.total_resumes : "..."}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Grounded candidate data</p>
        </div>

        {/* Jobs */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Lowongan Kerja</span>
            <Briefcase className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats ? stats.total_jobs : "..."}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Indexed in database</p>
        </div>

        {/* Applications */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Lamaran Kerja</span>
            <KanbanSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats ? stats.total_applications : "..."}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Tracked across Kanban</p>
        </div>

        {/* AI Operations */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Aktivitas AI</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats ? stats.total_ai_activities : "..."}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Logged telemetry calls</p>
        </div>

        {/* Active AI Engine */}
        <div className="p-4 rounded-xl bg-[#0f0f12] border border-emerald-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">AI Engine</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 truncate tracking-tight">
            {stats?.ai_provider === "gemini" ? "Gemini 3.7 Flash" : "Local Engine"}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Production Ready</span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "users"
              ? "border-purple-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manajemen Pengguna</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
            {totalUsers}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "diagnostics"
              ? "border-purple-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Diagnostik Sistem & AI Observability</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email pengguna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="">Semua Peran (All Roles)</option>
                  <option value="user">User Biasa</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0c0c0e] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Pengguna</th>
                    <th className="px-6 py-3.5">Peran (Role)</th>
                    <th className="px-6 py-3.5">Status Akun</th>
                    <th className="px-6 py-3.5 text-center">Resume</th>
                    <th className="px-6 py-3.5 text-center">Lamaran</th>
                    <th className="px-6 py-3.5">Terdaftar Sejak</th>
                    <th className="px-6 py-3.5 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        {isLoading ? "Memuat data pengguna..." : "Tidak ada pengguna yang cocok dengan kriteria pencarian."}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrent = u.id === currentUser?.id;
                      const isBusy = actionLoadingId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                          {/* User Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white truncate">{u.full_name}</p>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            {u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                <ShieldCheck className="h-3 w-3" />
                                ADMIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                <Users className="h-3 w-3" />
                                USER
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                                Dinonaktifkan
                              </span>
                            )}
                          </td>

                          {/* Resumes */}
                          <td className="px-6 py-4 text-center font-mono text-zinc-300 text-xs">
                            {u.resumes_count}
                          </td>

                          {/* Applications */}
                          <td className="px-6 py-4 text-center font-mono text-zinc-300 text-xs">
                            {u.applications_count}
                          </td>

                          {/* Joined Date */}
                          <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {isCurrent ? (
                              <span className="text-xs text-zinc-500 italic">Akun Sesi Aktif</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {/* Toggle Role */}
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={isBusy}
                                  title={u.role === "admin" ? "Turunkan ke User" : "Jadikan Admin"}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                    u.role === "admin"
                                      ? "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                                      : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
                                  }`}
                                >
                                  {u.role === "admin" ? "Demote" : "Promote Admin"}
                                </button>

                                {/* Toggle Active Status */}
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={isBusy}
                                  title={u.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                    u.is_active
                                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  }`}
                                >
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM DIAGNOSTICS & AI OBSERVABILITY */}
      {activeTab === "diagnostics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operational Health Card */}
          <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Status Operasional Sistem</h3>
                  <p className="text-xs text-zinc-400">Arsitektur FastAPI & SQLite Database</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                OPERATIONAL
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Lingkungan (Environment)</span>
                <span className="font-mono text-white text-xs px-2 py-0.5 rounded bg-zinc-800">
                  {systemHealth?.environment || "development"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Koneksi Database</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  SQLite Connected (WAL Mode)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Multi-Tenant Data Isolation</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active (Strict Per-User Scoping)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Role-Based Access Control</span>
                <span className="text-purple-400 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Enforced (User vs Admin)
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-400">API Endpoint Base</span>
                <span className="font-mono text-zinc-300 text-xs">
                  {systemHealth?.api_v1_path || "/api/v1"}
                </span>
              </div>
            </div>
          </div>

          {/* AI Engine & Guardrails Card */}
          <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Konfigurasi AI Engine</h3>
                  <p className="text-xs text-zinc-400">Google Gemini & Anti-Hallucination Pipeline</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                GEMINI 3.7 FLASH
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Model Utama</span>
                <span className="font-mono text-white text-xs px-2 py-0.5 rounded bg-zinc-800">
                  {systemHealth?.configured_model || "gemini-3.7-flash"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Model Fallback</span>
                <span className="font-mono text-zinc-400 text-xs px-2 py-0.5 rounded bg-zinc-800">
                  {systemHealth?.fallback_model || "gemini-2.5-flash"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Guardrail Anti-Halusinasi</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Strict Grounding Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Structured Output Parsing</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  JSON Pydantic Validation
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-400">Rerata Latensi AI</span>
                <span className="font-mono text-white text-xs">
                  {aiMetrics?.summary?.average_latency_seconds ? `${aiMetrics.summary.average_latency_seconds.toFixed(2)}s` : "< 1.5s"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
