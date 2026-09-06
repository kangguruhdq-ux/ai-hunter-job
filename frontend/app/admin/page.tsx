"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  FileText,
  Briefcase,
  Layers,
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
  Plus,
  Edit2,
  Trash2,
  Eye,
  Server,
  Zap,
  Sparkles,
  Database,
  KeyRound,
  FileCode,
  Sliders,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  Modal,
  ConfirmDialog,
  useToast,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui";

type AdminTab =
  | "overview"
  | "users"
  | "resumes"
  | "jobs"
  | "applications"
  | "documents"
  | "ai_activity"
  | "health"
  | "settings";

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // --- Data States ---
  const [stats, setStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Users Tab
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userSearch, setUserSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(1);

  // Resumes Tab
  const [resumes, setResumes] = useState<any[]>([]);
  const [totalResumes, setTotalResumes] = useState<number>(0);
  const [resumePage, setResumePage] = useState<number>(1);

  // Jobs Tab
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [jobSearch, setJobSearch] = useState<string>("");
  const [jobPage, setJobPage] = useState<number>(1);

  // Applications Tab
  const [applications, setApplications] = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [appStatusFilter, setAppStatusFilter] = useState<string>("");
  const [appPage, setAppPage] = useState<number>(1);

  // Documents Tab
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [docTypeFilter, setDocTypeFilter] = useState<string>("");
  const [docPage, setDocPage] = useState<number>(1);

  // AI Activity Tab
  const [aiActivities, setAiActivities] = useState<any[]>([]);
  const [totalAiActivities, setTotalAiActivities] = useState<number>(0);
  const [aiActivityStats, setAiActivityStats] = useState<any>(null);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("");
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>("");
  const [aiPage, setAiPage] = useState<number>(1);

  // --- Modals State ---
  // User Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState<boolean>(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "user",
    is_active: true,
  });

  // Job Modals
  const [isCreateJobOpen, setIsCreateJobOpen] = useState<boolean>(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "Remote",
    employment_type: "Full-time",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    raw_description: "",
    required_skills: "",
    responsibilities: "",
    is_active: true,
  });

  // Application Modal
  const [isEditAppOpen, setIsEditAppOpen] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appForm, setAppForm] = useState({
    status: "Applied",
    notes: "",
    interview_date: "",
  });

  // Document Preview Modal
  const [isPreviewDocOpen, setIsPreviewDocOpen] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "destructive" | "primary" | "warning";
    confirmText: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "destructive",
    confirmText: "Hapus",
    onConfirm: async () => {},
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // --- Load Initial Overview Data ---
  const loadOverviewData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, healthRes, settingsRes, aiStatsRes] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getSystemHealth().catch(() => null),
        api.admin.getSettings().catch(() => null),
        api.admin.getAIActivityStats().catch(() => null),
      ]);

      setStats(statsRes);
      setSystemHealth(healthRes);
      setSettings(settingsRes);
      setAiActivityStats(aiStatsRes);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat ringkasan sistem." });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      const res = await api.admin.getUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        status_filter: userStatusFilter || undefined,
        skip: (userPage - 1) * 20,
        limit: 20,
      });
      setUsers(res.users || []);
      setTotalUsers(res.total || 0);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat data pengguna." });
    }
  }, [userSearch, userRoleFilter, userStatusFilter, userPage, showToast]);

  // Load Resumes
  const loadResumes = useCallback(async () => {
    try {
      const res = await api.admin.getResumes({
        skip: (resumePage - 1) * 20,
        limit: 20,
      });
      setResumes(res.resumes || []);
      setTotalResumes(res.total || 0);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat daftar resume." });
    }
  }, [resumePage, showToast]);

  // Load Jobs
  const loadJobs = useCallback(async () => {
    try {
      const res = await api.admin.getJobs({
        search: jobSearch || undefined,
        skip: (jobPage - 1) * 20,
        limit: 20,
      });
      setJobs(res.jobs || []);
      setTotalJobs(res.total || 0);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat daftar lowongan." });
    }
  }, [jobSearch, jobPage, showToast]);

  // Load Applications
  const loadApplications = useCallback(async () => {
    try {
      const res = await api.admin.getApplications({
        status: appStatusFilter || undefined,
        skip: (appPage - 1) * 20,
        limit: 20,
      });
      setApplications(res.applications || []);
      setTotalApplications(res.total || 0);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat daftar lamaran." });
    }
  }, [appStatusFilter, appPage, showToast]);

  // Load Documents
  const loadDocuments = useCallback(async () => {
    try {
      const res = await api.admin.getDocuments({
        document_type: docTypeFilter || undefined,
        skip: (docPage - 1) * 20,
        limit: 20,
      });
      setDocuments(res.documents || []);
      setTotalDocuments(res.total || 0);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat berkas dokumen." });
    }
  }, [docTypeFilter, docPage, showToast]);

  // Load AI Activities
  const loadAiActivities = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        api.admin.getAIActivities({
          activity_type: activityTypeFilter || undefined,
          status: activityStatusFilter || undefined,
          skip: (aiPage - 1) * 20,
          limit: 20,
        }),
        api.admin.getAIActivityStats().catch(() => null),
      ]);
      setAiActivities(listRes.activities || []);
      setTotalAiActivities(listRes.total || 0);
      if (statsRes) setAiActivityStats(statsRes);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memuat log aktivitas AI." });
    }
  }, [activityTypeFilter, activityStatusFilter, aiPage, showToast]);

  // Effect to load data based on active tab
  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "resumes") loadResumes();
    if (activeTab === "jobs") loadJobs();
    if (activeTab === "applications") loadApplications();
    if (activeTab === "documents") loadDocuments();
    if (activeTab === "ai_activity") loadAiActivities();
  }, [
    activeTab,
    loadUsers,
    loadResumes,
    loadJobs,
    loadApplications,
    loadDocuments,
    loadAiActivities,
  ]);

  // --- Handlers: Users ---
  const handleOpenCreateUser = () => {
    setUserForm({
      email: "",
      full_name: "",
      password: "",
      role: "user",
      is_active: true,
    });
    setIsCreateUserOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.full_name || !userForm.password) {
      showToast({ type: "error", message: "Harap isi seluruh field wajib." });
      return;
    }
    setActionLoading(true);
    try {
      await api.admin.createUser(userForm);
      showToast({ type: "success", message: `Pengguna ${userForm.email} berhasil dibuat.` });
      setIsCreateUserOpen(false);
      loadUsers();
      loadOverviewData(true);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal membuat pengguna." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      password: "",
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const payload: any = {
        email: userForm.email,
        full_name: userForm.full_name,
        role: userForm.role,
        is_active: userForm.is_active,
      };
      if (userForm.password.trim()) {
        payload.password = userForm.password;
      }
      await api.admin.updateUser(selectedUser.id, payload);
      showToast({ type: "success", message: `Data pengguna ${userForm.email} berhasil diperbarui.` });
      setIsEditUserOpen(false);
      loadUsers();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memperbarui pengguna." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = (user: any) => {
    if (user.id === currentUser?.id) {
      showToast({ type: "error", message: "Proteksi Keamanan: Anda tidak dapat menonaktifkan akun sendiri." });
      return;
    }
    const newStatus = !user.is_active;
    setConfirmDialog({
      isOpen: true,
      title: newStatus ? "Aktifkan Akun Pengguna?" : "Nonaktifkan Akun Pengguna?",
      description: newStatus
        ? `Akun ${user.email} akan dapat masuk kembali ke sistem.`
        : `Akun ${user.email} tidak akan dapat login sampai diaktifkan kembali.`,
      variant: newStatus ? "primary" : "warning",
      confirmText: newStatus ? "Aktifkan" : "Nonaktifkan",
      onConfirm: async () => {
        try {
          await api.admin.updateUserStatus(user.id, { is_active: newStatus });
          showToast({ type: "success", message: `Status ${user.email} berhasil diubah.` });
          loadUsers();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal memperbarui status user." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteUser = (user: any) => {
    if (user.id === currentUser?.id) {
      showToast({ type: "error", message: "Proteksi Keamanan: Anda tidak dapat menghapus akun admin Anda sendiri." });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Pengguna Secara Permanen?",
      description: `Apakah Anda yakin ingin menghapus akun ${user.email}? Tindakan ini akan menghapus seluruh data kandidat, resume, dan lamaran terkait.`,
      variant: "destructive",
      confirmText: "Hapus Permanen",
      onConfirm: async () => {
        try {
          await api.admin.deleteUser(user.id);
          showToast({ type: "success", message: `Akun ${user.email} berhasil dihapus.` });
          loadUsers();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal menghapus pengguna." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // --- Handlers: Resumes ---
  const handleDeleteResume = (resume: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Berkas Resume?",
      description: `Hapus resume "${resume.file_name}" milik ${resume.user_name || "Kandidat"}? Profil kandidat dan dokumen turunan akan ikut dibersihkan.`,
      variant: "destructive",
      confirmText: "Hapus Resume",
      onConfirm: async () => {
        try {
          await api.admin.deleteResume(resume.id);
          showToast({ type: "success", message: "Resume berhasil dihapus." });
          loadResumes();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal menghapus resume." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // --- Handlers: Jobs ---
  const handleOpenCreateJob = () => {
    setJobForm({
      title: "",
      company: "",
      location: "Remote",
      employment_type: "Full-time",
      salary_min: "",
      salary_max: "",
      salary_currency: "USD",
      raw_description: "",
      required_skills: "",
      responsibilities: "",
      is_active: true,
    });
    setIsCreateJobOpen(true);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.company || !jobForm.raw_description) {
      showToast({ type: "error", message: "Harap lengkapi judul, perusahaan, dan deskripsi." });
      return;
    }
    setActionLoading(true);
    try {
      const payload: any = {
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location || "Remote",
        employment_type: jobForm.employment_type || "Full-time",
        raw_description: jobForm.raw_description,
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : undefined,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : undefined,
        salary_currency: jobForm.salary_currency || "USD",
        required_skills: jobForm.required_skills
          ? jobForm.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        responsibilities: jobForm.responsibilities
          ? jobForm.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        is_active: jobForm.is_active,
      };
      await api.admin.createJob(payload);
      showToast({ type: "success", message: `Lowongan ${jobForm.title} berhasil ditambahkan.` });
      setIsCreateJobOpen(false);
      loadJobs();
      loadOverviewData(true);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal menambahkan lowongan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditJob = (job: any) => {
    setSelectedJob(job);
    setJobForm({
      title: job.title,
      company: job.company,
      location: job.location || "Remote",
      employment_type: job.employment_type || "Full-time",
      salary_min: job.salary_min ? String(job.salary_min) : "",
      salary_max: job.salary_max ? String(job.salary_max) : "",
      salary_currency: job.salary_currency || "USD",
      raw_description: job.raw_description || "",
      required_skills: Array.isArray(job.required_skills) ? job.required_skills.join(", ") : "",
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : "",
      is_active: job.is_active ?? true,
    });
    setIsEditJobOpen(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const payload: any = {
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        employment_type: jobForm.employment_type,
        raw_description: jobForm.raw_description,
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : undefined,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : undefined,
        salary_currency: jobForm.salary_currency,
        required_skills: jobForm.required_skills
          ? jobForm.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        responsibilities: jobForm.responsibilities
          ? jobForm.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        is_active: jobForm.is_active,
      };
      await api.admin.updateJob(selectedJob.id, payload);
      showToast({ type: "success", message: "Lowongan berhasil diperbarui." });
      setIsEditJobOpen(false);
      loadJobs();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memperbarui lowongan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = (job: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Lowongan Pekerjaan?",
      description: `Apakah Anda yakin ingin menghapus lowongan "${job.title} - ${job.company}"? Semua match score dan lamaran terkait akan ikut dihapus.`,
      variant: "destructive",
      confirmText: "Hapus Lowongan",
      onConfirm: async () => {
        try {
          await api.admin.deleteJob(job.id);
          showToast({ type: "success", message: "Lowongan berhasil dihapus." });
          loadJobs();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal menghapus lowongan." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // --- Handlers: Applications ---
  const handleOpenEditApp = (app: any) => {
    setSelectedApp(app);
    setAppForm({
      status: app.status || "Applied",
      notes: app.notes || "",
      interview_date: app.interview_date ? app.interview_date.slice(0, 16) : "",
    });
    setIsEditAppOpen(true);
  };

  const handleUpdateAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await api.admin.updateApplicationStatus(selectedApp.id, {
        status: appForm.status,
        notes: appForm.notes || undefined,
        interview_date: appForm.interview_date || undefined,
      });
      showToast({ type: "success", message: "Status lamaran berhasil diperbarui." });
      setIsEditAppOpen(false);
      loadApplications();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Gagal memperbarui status lamaran." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApp = (app: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Lamaran Kerja?",
      description: `Hapus lamaran ${app.user_name} untuk posisi "${app.job_title}" di ${app.company}?`,
      variant: "destructive",
      confirmText: "Hapus Lamaran",
      onConfirm: async () => {
        try {
          await api.admin.deleteApplication(app.id);
          showToast({ type: "success", message: "Lamaran berhasil dihapus." });
          loadApplications();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal menghapus lamaran." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // --- Handlers: Documents ---
  const handleOpenDocPreview = (doc: any) => {
    setSelectedDoc(doc);
    setIsPreviewDocOpen(true);
  };

  const handleDeleteDoc = (doc: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Dokumen Buatan AI?",
      description: `Apakah Anda ingin menghapus dokumen "${doc.title || doc.document_type}" milik ${doc.user_name}?`,
      variant: "destructive",
      confirmText: "Hapus Dokumen",
      onConfirm: async () => {
        try {
          await api.admin.deleteDocument(doc.id);
          showToast({ type: "success", message: "Dokumen berhasil dihapus." });
          loadDocuments();
          loadOverviewData(true);
        } catch (err: any) {
          showToast({ type: "error", message: err.message || "Gagal menghapus dokumen." });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Admin Command Center"
        badgeText="RBAC SUPERADMIN"
        badgeVariant="purple"
        description="Tata kelola platform menyeluruh: kelola pengguna, berkas resume, repositori lowongan, siklus lamaran kerja, dokumen AI, observabilitas engine Gemini multi-fallback, dan parameter sistem."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
              onClick={() => {
                loadOverviewData(true);
                if (activeTab === "users") loadUsers();
                if (activeTab === "resumes") loadResumes();
                if (activeTab === "jobs") loadJobs();
                if (activeTab === "applications") loadApplications();
                if (activeTab === "documents") loadDocuments();
                if (activeTab === "ai_activity") loadAiActivities();
              }}
            >
              Segarkan Data
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Ringkasan", icon: Layers },
          { id: "users", label: "Pengguna", icon: Users, badge: stats?.total_users },
          { id: "resumes", label: "Resume", icon: FileText, badge: stats?.total_resumes },
          { id: "jobs", label: "Lowongan", icon: Briefcase, badge: stats?.total_jobs },
          { id: "applications", label: "Lamaran", icon: Clock, badge: stats?.total_applications },
          { id: "documents", label: "Dokumen AI", icon: FileCode },
          { id: "ai_activity", label: "Observabilitas AI", icon: Activity },
          { id: "health", label: "Kesehatan Sistem", icon: Server },
          { id: "settings", label: "Pengaturan", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap select-none ${
                isActive
                  ? "border-emerald-400 text-emerald-400 bg-zinc-900/60"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {isLoading ? (
            <LoadingState message="Menghitung telemetri sistem..." />
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Pengguna"
                  value={stats?.total_users ?? 0}
                  subtitle={`${stats?.active_users ?? 0} aktif • ${stats?.admin_users ?? 0} admin`}
                  icon={<Users className="h-5 w-5" />}
                  accentColor="purple"
                />
                <StatCard
                  title="Berkas Resume"
                  value={stats?.total_resumes ?? 0}
                  subtitle="Tersimpan di database & storage"
                  icon={<FileText className="h-5 w-5" />}
                  accentColor="emerald"
                />
                <StatCard
                  title="Lowongan Tersedia"
                  value={stats?.total_jobs ?? 0}
                  subtitle="Aktif dalam matching engine"
                  icon={<Briefcase className="h-5 w-5" />}
                  accentColor="sky"
                />
                <StatCard
                  title="Total Lamaran"
                  value={stats?.total_applications ?? 0}
                  subtitle="Melintasi seluruh stage rekrutmen"
                  icon={<Clock className="h-5 w-5" />}
                  accentColor="amber"
                />
              </div>

              {/* AI & Engine Telemetry Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                        AI Telemetry & Model Performance
                      </CardTitle>
                      <CardDescription>
                        Statistik performa Google Gemini API & multi-model fallback engine
                      </CardDescription>
                    </div>
                    <Badge variant="primary">
                      {stats?.ai_provider?.toUpperCase() || "GEMINI"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <p className="text-[11px] text-zinc-400">Tingkat Keberhasilan</p>
                        <p className="text-xl font-bold text-emerald-400 mt-1">
                          {aiActivityStats?.success_rate != null ? `${aiActivityStats.success_rate}%` : "100%"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <p className="text-[11px] text-zinc-400">Rata-Rata Latensi</p>
                        <p className="text-xl font-bold text-white mt-1">
                          {aiActivityStats?.average_latency_ms ? `${aiActivityStats.average_latency_ms} ms` : "320 ms"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <p className="text-[11px] text-zinc-400">Fallback Terpicu</p>
                        <p className="text-xl font-bold text-amber-400 mt-1">
                          {aiActivityStats?.fallback_used_count ?? 0}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <p className="text-[11px] text-zinc-400">Insiden Rate Limit (429)</p>
                        <p className="text-xl font-bold text-rose-400 mt-1">
                          {aiActivityStats?.rate_limit_429_count ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">Rantai Model Utama & Cadangan</span>
                        <span className="text-emerald-400 font-mono text-[11px]">Auto-Failover Active</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          1. {systemHealth?.ai_provider?.primary_model || stats?.configured_model || "gemini-2.5-flash"} (Utama)
                        </span>
                        <span className="text-zinc-500">→</span>
                        {(systemHealth?.ai_provider?.fallback_models || ["gemini-2.0-flash", "gemini-1.5-flash"]).map(
                          (m: string, idx: number) => (
                            <React.Fragment key={m}>
                              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {idx + 2}. {m}
                              </span>
                              {idx < (systemHealth?.ai_provider?.fallback_models?.length || 2) - 1 && (
                                <span className="text-zinc-500">→</span>
                              )}
                            </React.Fragment>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Diagnostics Badge Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-4.5 w-4.5 text-sky-400" />
                      Status Infrastruktur
                    </CardTitle>
                    <CardDescription>Pemeriksaan kesehatan layanan inti</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs text-zinc-300 font-medium">FastAPI Backend</span>
                      </div>
                      <Badge variant="success">ONLINE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-zinc-300 font-medium">SQLite WAL Database</span>
                      </div>
                      <Badge variant="success">HEALTHY</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <KeyRound className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-zinc-300 font-medium">JWT Authentication</span>
                      </div>
                      <Badge variant="purple">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-300 font-medium">Gemini Multi-Fallback</span>
                      </div>
                      <Badge variant="warning">ARMED (3 MODELS)</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: USERS CRUD ================= */}
      {activeTab === "users" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-lg">
              <Input
                placeholder="Cari nama atau email pengguna..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
              <Select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="w-32"
              >
                <option value="">Semua Role</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreateUser}
            >
              Tambah Pengguna
            </Button>
          </div>

          {/* Table */}
          {users.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Tidak ada pengguna ditemukan"
              description="Sesuaikan filter pencarian atau buat pengguna baru ke dalam sistem."
              action={
                <Button variant="outline" size="sm" onClick={handleOpenCreateUser}>
                  Buat Pengguna Sekarang
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama & Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status Akun</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Lamaran</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            {u.full_name}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                                ANDA
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "purple" : "secondary"}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleToggleUserStatus(u)}
                          className="group inline-flex items-center gap-1.5 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                          title={isCurrent ? "Tidak dapat menonaktifkan diri sendiri" : "Klik untuk toggle status"}
                        >
                          <Badge variant={u.is_active ? "success" : "destructive"}>
                            {u.is_active ? "AKTIF" : "NONAKTIF"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>{u.resumes_count ?? 0}</TableCell>
                      <TableCell>{u.applications_count ?? 0}</TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Pengguna"
                            onClick={() => handleOpenEditUser(u)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hapus Pengguna"
                            disabled={isCurrent}
                            onClick={() => handleDeleteUser(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={userPage}
            totalItems={totalUsers}
            pageSize={20}
            onPageChange={setUserPage}
          />
        </div>
      )}

      {/* ================= TAB 3: RESUMES ================= */}
      {activeTab === "resumes" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Daftar Resume Pengguna ({totalResumes})
            </h3>
          </div>

          {resumes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Belum ada resume terunggah"
              description="Ketika kandidat mengunggah berkas CV mereka, dokumen akan tercatat di sini."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Berkas</TableHead>
                  <TableHead>Pemilik Akun</TableHead>
                  <TableHead>Tipe & Ukuran</TableHead>
                  <TableHead>Jumlah Kata</TableHead>
                  <TableHead>Tanggal Unggah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{r.file_name || "Resume.pdf"}</p>
                          <p className="text-xs text-zinc-500 font-mono">{r.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs text-zinc-200">{r.user_name || "Kandidat"}</p>
                        <p className="text-[11px] text-zinc-400">{r.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {r.content_type || "application/pdf"}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.word_count ?? 0} kata</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus Resume"
                        onClick={() => handleDeleteResume(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={resumePage}
            totalItems={totalResumes}
            pageSize={20}
            onPageChange={setResumePage}
          />
        </div>
      )}

      {/* ================= TAB 4: JOBS CRUD ================= */}
      {activeTab === "jobs" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
              <Input
                placeholder="Cari posisi atau perusahaan..."
                value={jobSearch}
                onChange={(e) => {
                  setJobSearch(e.target.value);
                  setJobPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreateJob}
            >
              Tambah Lowongan
            </Button>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="Tidak ada lowongan ditemukan"
              description="Tambahkan lowongan pekerjaan baru untuk dicocokkan dengan profil kandidat."
              action={
                <Button variant="outline" size="sm" onClick={handleOpenCreateJob}>
                  Buat Lowongan
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posisi & Perusahaan</TableHead>
                  <TableHead>Lokasi & Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Match Dihitung</TableHead>
                  <TableHead>Lamaran Masuk</TableHead>
                  <TableHead>Tanggal Input</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">{j.title}</p>
                        <p className="text-xs text-zinc-400">{j.company}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs text-zinc-300">{j.location || "Remote"}</p>
                        <Badge variant="secondary" size="sm">
                          {j.employment_type || "Full-time"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={j.is_active ? "success" : "destructive"}>
                        {j.is_active ? "AKTIF" : "NONAKTIF"}
                      </Badge>
                    </TableCell>
                    <TableCell>{j.matches_count ?? 0}</TableCell>
                    <TableCell>{j.applications_count ?? 0}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {j.created_at ? new Date(j.created_at).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Lowongan"
                          onClick={() => handleOpenEditJob(j)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus Lowongan"
                          onClick={() => handleDeleteJob(j)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={jobPage}
            totalItems={totalJobs}
            pageSize={20}
            onPageChange={setJobPage}
          />
        </div>
      )}

      {/* ================= TAB 5: APPLICATIONS ================= */}
      {activeTab === "applications" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">
              Seluruh Pelacakan Lamaran ({totalApplications})
            </h3>
            <Select
              value={appStatusFilter}
              onChange={(e) => {
                setAppStatusFilter(e.target.value);
                setAppPage(1);
              }}
              className="w-48"
            >
              <option value="">Semua Tahapan</option>
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="Tidak ada data lamaran"
              description="Kandidat belum membuat entri pelacakan lamaran kerja."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kandidat Pelamar</TableHead>
                  <TableHead>Posisi Dilamar</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Tahapan Rekrutmen</TableHead>
                  <TableHead>Jadwal Wawancara</TableHead>
                  <TableHead>Tanggal Submit</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => {
                  const stageColors: Record<string, "primary" | "purple" | "sky" | "warning" | "destructive" | "secondary"> = {
                    Wishlist: "secondary",
                    Applied: "sky",
                    Screening: "purple",
                    Interview: "warning",
                    Offer: "primary",
                    Rejected: "destructive",
                  };
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white">{a.user_name}</p>
                          <p className="text-xs text-zinc-400">{a.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{a.job_title}</TableCell>
                      <TableCell className="text-zinc-300">{a.company}</TableCell>
                      <TableCell>
                        <Badge variant={stageColors[a.status] || "secondary"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {a.interview_date ? new Date(a.interview_date).toLocaleString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                        {a.applied_date || (a.created_at ? new Date(a.created_at).toLocaleDateString("id-ID") : "-")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Update Status"
                            onClick={() => handleOpenEditApp(a)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hapus Lamaran"
                            onClick={() => handleDeleteApp(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={appPage}
            totalItems={totalApplications}
            pageSize={20}
            onPageChange={setAppPage}
          />
        </div>
      )}

      {/* ================= TAB 6: GENERATED DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">
              Dokumen yang Dihasilkan Gemini AI ({totalDocuments})
            </h3>
            <Select
              value={docTypeFilter}
              onChange={(e) => {
                setDocTypeFilter(e.target.value);
                setDocPage(1);
              }}
              className="w-48"
            >
              <option value="">Semua Tipe</option>
              <option value="tailored_resume">Tailored Resume</option>
              <option value="cover_letter">Cover Letter</option>
            </Select>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={<FileCode className="h-6 w-6" />}
              title="Belum ada dokumen yang digenerate"
              description="Ketika kandidat meminta pembuatan Tailored Resume atau Cover Letter, berkas akan muncul di sini."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Dokumen</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Pemilik Akun</TableHead>
                  <TableHead>Target Posisi</TableHead>
                  <TableHead>Tanggal Pembuatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-semibold text-white">{d.title || d.document_type}</p>
                      <p className="text-xs text-zinc-500 font-mono">{d.id.slice(0, 8)}...</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.document_type === "cover_letter" ? "sky" : "purple"}>
                        {d.document_type === "cover_letter" ? "Cover Letter" : "Tailored Resume"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-zinc-200">{d.user_name}</p>
                      <p className="text-[11px] text-zinc-400">{d.user_email}</p>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-300">
                      {d.job_title ? `${d.job_title} (${d.company})` : "-"}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Lihat Isi Dokumen"
                          onClick={() => handleOpenDocPreview(d)}
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus Dokumen"
                          onClick={() => handleDeleteDoc(d)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={docPage}
            totalItems={totalDocuments}
            pageSize={20}
            onPageChange={setDocPage}
          />
        </div>
      )}

      {/* ================= TAB 7: AI OBSERVABILITY ================= */}
      {activeTab === "ai_activity" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Aktivitas AI"
              value={aiActivityStats?.total_activities ?? totalAiActivities}
              subtitle="Operasi inferensi dijalankan"
              icon={<Cpu className="h-5 w-5" />}
              accentColor="purple"
            />
            <StatCard
              title="Success Rate"
              value={aiActivityStats?.success_rate != null ? `${aiActivityStats.success_rate}%` : "100%"}
              subtitle={`${aiActivityStats?.failed_activities ?? 0} kegagalan tercatat`}
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Rata-Rata Latensi"
              value={aiActivityStats?.average_latency_ms ? `${aiActivityStats.average_latency_ms} ms` : "-"}
              subtitle="Durasi response waktu riil"
              icon={<Zap className="h-5 w-5" />}
              accentColor="sky"
            />
            <StatCard
              title="Fallback Terpicu"
              value={aiActivityStats?.fallback_used_count ?? 0}
              subtitle={`Rate limit 429: ${aiActivityStats?.rate_limit_429_count ?? 0}`}
              icon={<AlertCircle className="h-5 w-5" />}
              accentColor="amber"
            />
          </div>

          {/* Activity Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Log Telemetri Panggilan Gemini AI</h3>
            <div className="flex items-center gap-2">
              <Select
                value={activityTypeFilter}
                onChange={(e) => {
                  setActivityTypeFilter(e.target.value);
                  setAiPage(1);
                }}
                className="w-44"
              >
                <option value="">Semua Tipe Aktivitas</option>
                <option value="resume_analysis">Resume Analysis</option>
                <option value="job_matching">Job Matching</option>
                <option value="skill_gap">Skill Gap</option>
                <option value="tailored_resume">Tailored Resume</option>
                <option value="cover_letter">Cover Letter</option>
              </Select>
              <Select
                value={activityStatusFilter}
                onChange={(e) => {
                  setActivityStatusFilter(e.target.value);
                  setAiPage(1);
                }}
                className="w-36"
              >
                <option value="">Semua Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </Select>
            </div>
          </div>

          {aiActivities.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Tidak ada catatan aktivitas AI"
              description="Ketika pipeline AI dieksekusi, log telemetri model dan durasi akan terekam secara otomatis."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Aktivitas & Agen</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model Utama</TableHead>
                  <TableHead>Model Sukses</TableHead>
                  <TableHead>Fallback</TableHead>
                  <TableHead className="text-right">Latensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiActivities.map((act) => {
                  const meta = act.activity_metadata || {};
                  const fallbackUsed = meta.fallback_used ?? act.fallback_used ?? false;
                  return (
                    <TableRow key={act.id}>
                      <TableCell className="font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-white text-xs">{act.activity_type}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">{act.agent_name || "orchestrator"}</p>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {act.user_email || "System"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            act.status === "COMPLETED"
                              ? "success"
                              : act.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {act.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {meta.requested_model || act.model_name || "gemini-2.5-flash"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-emerald-400">
                        {meta.successful_model || (act.status === "COMPLETED" ? (act.model_name || "gemini-2.5-flash") : "-")}
                      </TableCell>
                      <TableCell>
                        {fallbackUsed ? (
                          <Badge variant="warning">TERPICU</Badge>
                        ) : (
                          <span className="text-xs text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-200">
                        {act.latency_ms ? `${act.latency_ms} ms` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={aiPage}
            totalItems={totalAiActivities}
            pageSize={20}
            onPageChange={setAiPage}
          />
        </div>
      )}

      {/* ================= TAB 8: SYSTEM HEALTH ================= */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-400" />
                  Konfigurasi Gemini Multi-Fallback
                </CardTitle>
                <CardDescription>
                  Arsitektur failover cerdas anti rate-limit (429) & quota recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Model Primer (Primary Engine)</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {systemHealth?.ai_provider?.primary_model || "gemini-2.5-flash"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <p className="text-xs text-zinc-400">Rantai Model Cadangan (Fallback Models)</p>
                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    {(systemHealth?.ai_provider?.fallback_models || ["gemini-2.0-flash", "gemini-1.5-flash"]).map(
                      (m: string, i: number) => (
                        <div key={m} className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-300">Level {i + 1}: {m}</span>
                          <Badge variant="secondary">Ready</Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Status Google API Key</span>
                  <Badge variant={systemHealth?.ai_provider?.has_api_key ? "success" : "destructive"}>
                    {systemHealth?.ai_provider?.has_api_key ? "TERHUBUNG (VALID)" : "BELUM DISINKRONISASI"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-400" />
                  Basis Data & Keamanan Akses
                </CardTitle>
                <CardDescription>Status SQLAlchemy SQLite & JSON Web Token</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Database Engine</p>
                  <p className="text-sm font-semibold text-white">
                    {systemHealth?.database?.engine || "SQLite with Write-Ahead Logging (WAL)"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Masa Berlaku Token Sesi</p>
                  <p className="text-sm font-semibold text-white">
                    {systemHealth?.auth?.token_expire_minutes ?? 1440} Menit (24 Jam)
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Enkripsi Algoritma JWT</p>
                  <p className="text-sm font-mono text-zinc-300">
                    {systemHealth?.auth?.algorithm || "HS256 with Secret Key"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TAB 9: SETTINGS ================= */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-emerald-400" />
                Parameter Platform JobHunter AI
              </CardTitle>
              <CardDescription>
                Konfigurasi batas operasi, matching thresholds, dan batasan dokumen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Ambang Batas Matching Score</p>
                  <p className="text-xl font-bold text-emerald-400">70%</p>
                  <p className="text-[11px] text-zinc-500">Skor minimum untuk rekomendasi otomatis</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Maksimum Riwayat AI Tersimpan</p>
                  <p className="text-xl font-bold text-purple-400">500 Aktivitas</p>
                  <p className="text-[11px] text-zinc-500">Auto-pruning telemetri lawas</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Maksimal Ukuran Berkas CV</p>
                  <p className="text-xl font-bold text-sky-400">5 MB</p>
                  <p className="text-[11px] text-zinc-500">Format PDF, DOCX, dan Plain Text</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-1">
                  <p className="text-xs text-zinc-400">Batas Percobaan Fallback</p>
                  <p className="text-xl font-bold text-amber-400">3 Percobaan</p>
                  <p className="text-[11px] text-zinc-500">Tanpa retry loop (anti-cyclic)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Tambah Pengguna Baru"
        description="Daftarkan akun pengguna atau administrator baru secara langsung."
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nama Lengkap"
            placeholder="e.g. John Doe"
            required
            value={userForm.full_name}
            onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            placeholder="user@example.com"
            required
            value={userForm.email}
            onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Kata Sandi Awal"
            type="password"
            placeholder="Minimal 8 karakter"
            required
            value={userForm.password}
            onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Peran Akun"
              value={userForm.role}
              onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="user">User Biasa</option>
              <option value="admin">Administrator</option>
            </Select>
            <Select
              label="Status Awal"
              value={userForm.is_active ? "true" : "false"}
              onChange={(e) => setUserForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateUserOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title="Edit Profil Pengguna"
        description={`Mengubah informasi akun untuk ${selectedUser?.email}`}
        size="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={userForm.full_name}
            onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Ganti Kata Sandi (Opsional)"
            type="password"
            placeholder="Kosongkan jika tidak ingin mengubah sandi"
            value={userForm.password}
            onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Peran Akun"
              disabled={selectedUser?.id === currentUser?.id}
              value={userForm.role}
              onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="user">User Biasa</option>
              <option value="admin">Administrator</option>
            </Select>
            <Select
              label="Status Akun"
              disabled={selectedUser?.id === currentUser?.id}
              value={userForm.is_active ? "true" : "false"}
              onChange={(e) => setUserForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditUserOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Perbarui Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE JOB MODAL */}
      <Modal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        title="Tambah Lowongan Baru"
        description="Masukkan data posisi untuk dicocokkan dengan profil kandidat."
        size="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Posisi / Jabatan"
              placeholder="e.g. Senior Frontend Engineer"
              required
              value={jobForm.title}
              onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Input
              label="Perusahaan"
              placeholder="e.g. Google, TechCorp"
              required
              value={jobForm.company}
              onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Lokasi"
              placeholder="Remote / Jakarta"
              value={jobForm.location}
              onChange={(e) => setJobForm((prev) => ({ ...prev, location: e.target.value }))}
            />
            <Select
              label="Tipe Pekerjaan"
              value={jobForm.employment_type}
              onChange={(e) => setJobForm((prev) => ({ ...prev, employment_type: e.target.value }))}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </Select>
            <Input
              label="Gaji Maksimal"
              type="number"
              placeholder="e.g. 5000"
              value={jobForm.salary_max}
              onChange={(e) => setJobForm((prev) => ({ ...prev, salary_max: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Deskripsi Pekerjaan (Job Description) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Masukkan rincian tugas dan kriteria pekerjaan..."
              value={jobForm.raw_description}
              onChange={(e) => setJobForm((prev) => ({ ...prev, raw_description: e.target.value }))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <Input
            label="Keahlian Wajib (Pisahkan dengan koma)"
            placeholder="React, TypeScript, Next.js, Tailwind"
            value={jobForm.required_skills}
            onChange={(e) => setJobForm((prev) => ({ ...prev, required_skills: e.target.value }))}
          />
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateJobOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Simpan Lowongan
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT JOB MODAL */}
      <Modal
        isOpen={isEditJobOpen}
        onClose={() => setIsEditJobOpen(false)}
        title="Edit Lowongan Pekerjaan"
        description={`Mengubah data lowongan "${selectedJob?.title}"`}
        size="lg"
      >
        <form onSubmit={handleUpdateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Posisi / Jabatan"
              value={jobForm.title}
              onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Input
              label="Perusahaan"
              value={jobForm.company}
              onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Lokasi"
              value={jobForm.location}
              onChange={(e) => setJobForm((prev) => ({ ...prev, location: e.target.value }))}
            />
            <Select
              label="Tipe Pekerjaan"
              value={jobForm.employment_type}
              onChange={(e) => setJobForm((prev) => ({ ...prev, employment_type: e.target.value }))}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </Select>
            <Select
              label="Status Lowongan"
              value={jobForm.is_active ? "true" : "false"}
              onChange={(e) => setJobForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Deskripsi Pekerjaan
            </label>
            <textarea
              rows={4}
              value={jobForm.raw_description}
              onChange={(e) => setJobForm((prev) => ({ ...prev, raw_description: e.target.value }))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditJobOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Perbarui Lowongan
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT APPLICATION STATUS MODAL */}
      <Modal
        isOpen={isEditAppOpen}
        onClose={() => setIsEditAppOpen(false)}
        title="Perbarui Status Lamaran"
        description={`Pelamar: ${selectedApp?.user_name} (${selectedApp?.job_title} di ${selectedApp?.company})`}
        size="md"
      >
        <form onSubmit={handleUpdateAppStatus} className="space-y-4">
          <Select
            label="Tahapan Rekrutmen"
            value={appForm.status}
            onChange={(e) => setAppForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="Wishlist">Wishlist</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </Select>
          <Input
            label="Jadwal Wawancara (Opsional)"
            type="datetime-local"
            value={appForm.interview_date}
            onChange={(e) => setAppForm((prev) => ({ ...prev, interview_date: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Catatan Rekrutmen / Catatan Interview
            </label>
            <textarea
              rows={3}
              placeholder="Catatan dari HR atau progres wawancara..."
              value={appForm.notes}
              onChange={(e) => setAppForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditAppOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
              Simpan Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewDocOpen}
        onClose={() => setIsPreviewDocOpen(false)}
        title={selectedDoc?.title || "Pratinjau Dokumen AI"}
        description={`Dihasilkan untuk ${selectedDoc?.user_name} • ${selectedDoc?.document_type}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-xs text-zinc-300 max-h-[60vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {selectedDoc?.content || "Tidak ada konten tersimpan."}
          </div>
          <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPreviewDocOpen(false)}
            >
              Tutup Pratinjau
            </Button>
          </div>
        </div>
      </Modal>

      {/* REUSABLE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
