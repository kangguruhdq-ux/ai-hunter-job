"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  KanbanSquare, 
  CheckCircle2, 
  Activity, 
  Lock, 
  Award,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)] group-hover:border-emerald-500/50 transition-colors">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              JobHunter <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-200 transition-colors">Fitur Unggulan</a>
            <a href="#demo" className="hover:text-zinc-200 transition-colors">Live Preview</a>
            <a href="#architecture" className="hover:text-zinc-200 transition-colors">Arsitektur & AI</a>
            <Link href="/admin" className="hover:text-zinc-200 transition-colors">Admin Portal</Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all"
                >
                  <span>Mulai Gratis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[250px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Autonomous AI Career Copilot • 100% Anti-Hallucination</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Asisten Karir Otonom AI{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Berbasis Fakta Asli CV Anda
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed">
            Platform intelijen karir otomatis yang mencocokkan profil Anda dengan peluang kerja secara deterministik 5-dimensi, menyusun resume ATS teroptimasi tanpa rekayasa data, dan mengotomasi pipeline lamaran kerja.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-xl shadow-emerald-950/60 hover:shadow-emerald-900/80 transition-all hover:scale-[1.02]"
            >
              <span>Mulai Akun Gratis</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/resume"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold border border-zinc-700/80 transition-all hover:border-zinc-600"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Analisis Resume Saya</span>
            </Link>
          </div>

          {/* Trust Metrics Row */}
          <div className="pt-8 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-xl font-bold text-white font-mono">100%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Bebas Halusinasi Data</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400 font-mono">5-Dimensi</p>
              <p className="text-xs text-zinc-500 mt-0.5">Skoring Deterministik</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white font-mono">&lt; 1.5s</p>
              <p className="text-xs text-zinc-500 mt-0.5">Pencocokan Cepat</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400 font-mono">Zero-Leak</p>
              <p className="text-xs text-zinc-500 mt-0.5">Isolasi Data Pengguna</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Product Demo Visual */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900/80 to-[#121215] border border-zinc-800 p-4 sm:p-6 md:p-8 shadow-2xl glass-card">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-500">jobhunter-ai :: matching-engine</span>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-semibold text-emerald-400">
              Live Engine Preview
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Ground Truth Resume Profile */}
            <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">1. Profil Terverifikasi</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Faktual</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">Mahabbah Mahabban Romadhon</p>
                <p className="text-xs text-zinc-400">Teknik Komputer & Jaringan • SMKN 3 Yogyakarta</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {["MikroTik MTCNA", "Cisco Routing", "Debian Linux", "TCP/IP", "Fiber Optic"].map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 italic pt-2 border-t border-zinc-800/60">
                Data diekstrak murni dari PDF tanpa placeholder palsu ("Role at Immersa").
              </p>
            </div>

            {/* Card 2: 5-D Match Score */}
            <div className="p-5 rounded-xl bg-zinc-950/80 border border-emerald-500/30 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">2. Analisis Kecocokan</span>
                <span className="text-lg font-bold font-mono text-emerald-400">92%</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Network & Infrastructure Specialist</p>
                <p className="text-xs text-zinc-400">PT Solusi Jaringan Nusantara • Jakarta</p>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Keahlian Teknis (40%)</span>
                  <span className="font-mono text-emerald-400 font-semibold">95%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "95%" }} />
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kesesuaian Pengalaman (25%)</span>
                  <span className="font-mono text-emerald-400 font-semibold">90%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "90%" }} />
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Pendidikan & Sertifikasi (20%)</span>
                  <span className="font-mono text-emerald-400 font-semibold">92%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>

            {/* Card 3: Automated Pipeline */}
            <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">3. Pipeline Otonom</span>
                <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Kanban</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300">Resume Disesuaikan</span>
                  <span className="text-emerald-400 font-medium">Siap Diunduh</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300">Surat Lamaran (Cover Letter)</span>
                  <span className="text-emerald-400 font-medium">Terformulasi</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300">Status Lamaran</span>
                  <span className="text-blue-400 font-medium">Applied & Tracking</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="w-full block text-center py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  Coba Alur Ini Sekarang &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Award className="h-3.5 w-3.5" />
            <span>Kapabilitas Inti</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Fitur Kelas Dunia untuk Efisiensi Karir Maksimal
          </h2>
          <p className="text-sm text-zinc-400">
            Dirancang dari awal untuk menghilangkan pekerjaan repetitif pencarian kerja tanpa mengorbankan integritas faktual profil Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Ground-Truth CV Parser</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mengekstraksi teks dari berkas PDF dan DOCX secara deterministik. Menjaga keaslian nama, institusi, nilai, dan kompetensi tanpa modifikasi sintetis.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Skoring Deterministik 5-Dimensi</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kalkulasi kecocokan matematis yang transparan mencakup Keahlian Teknis, Pengalaman Relevan, Riwayat Pendidikan, Sertifikasi, dan Kesesuaian Industri.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Anti-Hallucination Guardrail</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sistem sanitasi ketat yang memblokir placeholder palsu seperti "Role at Company" atau "in Field". Jika data tidak tercantum di CV, sistem membiarkannya kosong.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">ATS Resume Tailoring</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Menyesuaikan penekanan kata kunci pada resume secara kontekstual sesuai persyaratan lowongan spesifik untuk meningkatkan kelulusan screening ATS.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Autonomous Application Kanban</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Lacak setiap tahap lamaran mulai dari draft, terkirim, wawancara teknis, hingga penawaran kerja dalam satu papan kendali visual responsif.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800 glass-card glass-card-hover space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">AI Observability & Telemetry</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pantau seluruh aktivitas inferensi model AI secara transparan, lengkap dengan latensi eksekusi, token metadata, dan verifikasi kelaikan sistem.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Architecture & Trust Section */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-800/60">
        <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-8 md:p-12 glass-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <Lock className="h-3.5 w-3.5" />
                <span>Enterprise Privacy & Security</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Dibangun di Atas Arsitektur Terisolasi & Tangguh
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Setiap data kandidat diisolasi per akun pengguna dengan autentikasi berbasis token JWT standar industri. Basis data SQLite beroperasi dalam mode WAL (Write-Ahead Logging) dengan non-blocking thread execution untuk stabilitas maksimal.
              </p>
              <div className="space-y-2 pt-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Frontend: Next.js 14 + Tailwind CSS + App Router</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Backend: FastAPI + SQLAlchemy 2.0 + SQLite WAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Model AI: Google Gemini 2.5 Flash dengan Fallback Aman</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-zinc-400 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-500">
                <span>SYSTEM HEALTH CHECK</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <p className="text-zinc-300">$ curl -X GET http://localhost:8000/api/v1/health</p>
              <p className="text-emerald-400 font-semibold">{`{"status": "ok", "db": "healthy", "ai_provider": "ready"}`}</p>
              <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>SQLite Journal Mode:</span>
                  <span className="text-zinc-200">WAL (Concurrency Enabled)</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Isolation:</span>
                  <span className="text-zinc-200">User Scope Strict</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Timeout Guard:</span>
                  <span className="text-zinc-200">35s with Adaptive Fallback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Mulai Raih Karir Impian Anda Sekarang
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
          Bergabunglah dengan JobHunter AI hari ini dan rasakan kemudahan mencari lowongan relevan tanpa rekayasa data.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02]"
          >
            <span>Daftar Akun Baru</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold border border-zinc-700/80 transition-colors"
          >
            Masuk ke Akun
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-zinc-300">JobHunter AI</span>
            <span>— Asisten Karir Otonom Generasi Baru</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-zinc-300 transition-colors">Daftar</Link>
            <Link href="/resume" className="hover:text-zinc-300 transition-colors">Resume</Link>
            <Link href="/admin" className="hover:text-zinc-300 transition-colors">Admin Portal</Link>
          </div>

          <p>&copy; {new Date().getFullYear()} JobHunter AI. Hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>
    </div>
  );
}
