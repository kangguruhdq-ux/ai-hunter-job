// Typed API client for JobHunter AI backend with JWT Bearer Token Support

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "jobhunter_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      errorMsg = errData.detail || errorMsg;
    } catch {
      // Fallback
    }

    // Auto-redirect to login on 401 if on protected route
    if (res.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        setStoredToken(null);
        window.location.href = "/login";
      }
    }

    throw new Error(errorMsg);
  }

  // If 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Authentication
  register: (data: { email: string; full_name: string; password: string }) =>
    fetchJson<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchJson<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  logout: () => fetchJson<any>("/auth/logout", { method: "POST" }),

  getMe: () => fetchJson<any>("/auth/me"),

  // Admin Command Center & Full Platform Management
  admin: {
    getStats: () => fetchJson<any>("/admin/stats"),

    // Users CRUD
    createUser: (data: { email: string; full_name: string; password: string; role?: string; is_active?: boolean }) =>
      fetchJson<any>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
    getUsers: (params?: { search?: string; role?: string; status_filter?: string; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.role) q.append("role", params.role);
      if (params?.status_filter) q.append("status_filter", params.status_filter);
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/users${qs}`);
    },
    getUser: (userId: string) => fetchJson<any>(`/admin/users/${userId}`),
    updateUser: (userId: string, data: { email?: string; full_name?: string; role?: string; is_active?: boolean; password?: string }) =>
      fetchJson<any>(`/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
    updateUserStatus: (userId: string, data: { is_active?: boolean; role?: string }) =>
      fetchJson<any>(`/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteUser: (userId: string) =>
      fetchJson<void>(`/admin/users/${userId}`, { method: "DELETE" }),

    // Resumes Management
    getResumes: (params?: { search?: string; user_id?: string; status?: string; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.user_id) q.append("user_id", params.user_id);
      if (params?.status) q.append("status", params.status);
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/resumes${qs}`);
    },
    deleteResume: (resumeId: string) =>
      fetchJson<void>(`/admin/resumes/${resumeId}`, { method: "DELETE" }),

    // Jobs CRUD
    createJob: (data: any) =>
      fetchJson<any>("/admin/jobs", { method: "POST", body: JSON.stringify(data) }),
    getJobs: (params?: { search?: string; company?: string; location?: string; is_active?: boolean; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.company) q.append("company", params.company);
      if (params?.location) q.append("location", params.location);
      if (params?.is_active !== undefined) q.append("is_active", String(params.is_active));
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/jobs${qs}`);
    },
    getJob: (jobId: string) => fetchJson<any>(`/admin/jobs/${jobId}`),
    updateJob: (jobId: string, data: any) =>
      fetchJson<any>(`/admin/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteJob: (jobId: string) =>
      fetchJson<void>(`/admin/jobs/${jobId}`, { method: "DELETE" }),

    // Applications Management
    getApplications: (params?: { search?: string; user_id?: string; status?: string; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.user_id) q.append("user_id", params.user_id);
      if (params?.status) q.append("status", params.status);
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/applications${qs}`);
    },
    updateApplicationStatus: (appId: string, data: { status: string; notes?: string; interview_date?: string }) =>
      fetchJson<any>(`/admin/applications/${appId}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteApplication: (appId: string) =>
      fetchJson<void>(`/admin/applications/${appId}`, { method: "DELETE" }),

    // Generated Documents Management
    getDocuments: (params?: { search?: string; document_type?: string; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.document_type) q.append("document_type", params.document_type);
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/documents${qs}`);
    },
    deleteDocument: (documentId: string) =>
      fetchJson<void>(`/admin/documents/${documentId}`, { method: "DELETE" }),

    // AI Activity Monitoring & Telemetry
    getAIActivities: (params?: { status?: string; agent_name?: string; model_name?: string; fallback_used?: boolean; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append("status", params.status);
      if (params?.agent_name) q.append("agent_name", params.agent_name);
      if (params?.model_name) q.append("model_name", params.model_name);
      if (params?.fallback_used !== undefined) q.append("fallback_used", String(params.fallback_used));
      if (params?.skip) q.append("skip", String(params.skip));
      if (params?.limit) q.append("limit", String(params.limit));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return fetchJson<any>(`/admin/ai-activities${qs}`);
    },
    getAIActivityStats: () => fetchJson<any>("/admin/ai-activities/stats"),
    getAIMetrics: () => fetchJson<any>("/admin/ai-metrics"),

    // System Health & Settings
    getSystemHealth: () => fetchJson<any>("/admin/system-health"),
    getSettings: () => fetchJson<any>("/admin/settings"),
    updateSettings: (data: any) =>
      fetchJson<any>("/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Resume
  uploadResume: async (file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/resume/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload resume.");
    }
    return res.json();
  },
  getLatestResume: () => fetchJson<any>("/resume/latest"),
  listResumes: () => fetchJson<any[]>("/resume"),

  // Candidate Profile
  getProfile: () => fetchJson<any>("/candidate/profile"),
  updateProfile: (data: any) =>
    fetchJson<any>("/candidate/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  analyzeResume: (resumeId?: string) => {
    if (resumeId) {
      return fetchJson<any>(`/candidate/profile/extract/${resumeId}`, { method: "POST" });
    }
    return fetchJson<any>("/candidate/resume/analyze", { method: "POST" });
  },

  // Preferences / Memory
  getPreferences: () => fetchJson<any>("/candidate/preferences"),
  updatePreferences: (data: any) =>
    fetchJson<any>("/candidate/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Jobs
  listJobs: (search?: string, location?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (location) params.append("location", location);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<any[]>(`/jobs${query}`);
  },
  getJob: (jobId: string) => fetchJson<any>(`/jobs/${jobId}`),
  createJobPasted: (data: { title?: string; company?: string; raw_text: string }) =>
    fetchJson<any>("/jobs", { method: "POST", body: JSON.stringify(data) }),
  createJobUrl: (url: string) =>
    fetchJson<any>("/jobs/import-url", { method: "POST", body: JSON.stringify({ url }) }),
  createJobManual: (data: any) =>
    fetchJson<any>("/jobs/manual", { method: "POST", body: JSON.stringify(data) }),
  seedJobs: () => fetchJson<any[]>("/jobs/seed", { method: "POST" }),
  deleteJob: (jobId: string) => fetchJson<void>(`/jobs/${jobId}`, { method: "DELETE" }),

  // Matching & Recommendations
  calculateMatch: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/match`, { method: "POST" }),
  getJobMatch: (jobId: string) => fetchJson<any>(`/jobs/${jobId}/match`),
  getRecommendedRanked: (limit = 10) =>
    fetchJson<any[]>(`/jobs/recommended/ranked?limit=${limit}`),
  getSkillGapAnalysis: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/skill-gap`),

  // Documents
  generateTailoredResume: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/tailored-resume`, { method: "POST" }),
  getLatestTailoredResume: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/tailored-resume`),
  generateCoverLetter: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/cover-letter`, { method: "POST" }),
  getLatestCoverLetter: (jobId: string) =>
    fetchJson<any>(`/jobs/${jobId}/cover-letter`),
  getDocument: (docId: string) => fetchJson<any>(`/documents/${docId}`),
  updateDocument: (docId: string, data: { title?: string; content: string }) =>
    fetchJson<any>(`/documents/${docId}`, { method: "PUT", body: JSON.stringify(data) }),
  listDocuments: (type?: string, jobId?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("document_type", type);
    if (jobId) params.append("job_id", jobId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<any[]>(`/documents${query}`);
  },
  getDownloadUrl: (docId: string) => `${API_BASE}/documents/${docId}/download`,

  // Applications
  createApplication: (data: any) =>
    fetchJson<any>("/applications", { method: "POST", body: JSON.stringify(data) }),
  getKanban: (includeArchived = false) =>
    fetchJson<any[]>(`/applications/kanban?include_archived=${includeArchived}`),
  listApplications: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return fetchJson<any[]>(`/applications${query}`);
  },
  updateApplication: (appId: string, data: any) =>
    fetchJson<any>(`/applications/${appId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteApplication: (appId: string) =>
    fetchJson<void>(`/applications/${appId}`, { method: "DELETE" }),

  // Activity & Observability
  listActivities: (limit = 25) =>
    fetchJson<any[]>(`/ai/activity?limit=${limit}`),
  getDashboardStats: () =>
    fetchJson<any>("/ai/dashboard-stats"),
  getEvaluation: () =>
    fetchJson<any>("/ai/evaluation"),
  runPipeline: (jobId: string) =>
    fetchJson<any>(`/ai/pipeline/${jobId}`, { method: "POST" }),
};

