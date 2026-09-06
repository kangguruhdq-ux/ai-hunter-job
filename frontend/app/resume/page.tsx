"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile editable state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setLocation(data.location || "");
        setSummary(data.summary || "");
        setSkills(Array.isArray(data.skills) ? data.skills : []);
        setExperience(Array.isArray(data.experience) ? data.experience : []);
        setEducation(Array.isArray(data.education) ? data.education : []);
      }
    } catch (err: any) {
      // It's normal if no profile exists yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      validateAndSetFile(selected);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setError("Please upload a PDF (.pdf) or Word document (.docx).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      setSuccessMsg("Uploading and parsing document text...");
      
      const uploadRes = await api.uploadResume(file);
      
      setSuccessMsg("Document parsed! Running AI Candidate Profiler...");
      setAnalyzing(true);
      
      const profileRes = await api.analyzeResume(uploadRes.id);
      setProfile(profileRes);
      setFullName(profileRes.full_name || "");
      setEmail(profileRes.email || "");
      setPhone(profileRes.phone || "");
      setLocation(profileRes.location || "");
      setSummary(profileRes.summary || "");
      setSkills(Array.isArray(profileRes.skills) ? profileRes.skills : []);
      setExperience(Array.isArray(profileRes.experience) ? profileRes.experience : []);
      setEducation(Array.isArray(profileRes.education) ? profileRes.education : []);
      
      setSuccessMsg("Candidate profile extracted and saved successfully!");
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to upload or analyze resume.");
      setSuccessMsg(null);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateProfile({
        full_name: fullName,
        email,
        phone,
        location,
        summary,
        skills,
        experience,
        education,
      });
      setProfile(updated);
      setSuccessMsg("Candidate profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-400" />
            <span>Resume & Candidate Profile</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Upload your master resume. The AI extracts your factual background to power deterministic matching and hallucination-free application documents.
          </p>
        </div>

        {profile && (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.docx"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {file ? file.name : "Upload Your Master Resume"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Supports PDF and DOCX files up to 10MB.
            </p>
          </div>

          {file ? (
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={handleUploadAndAnalyze}
                disabled={uploading || analyzing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {uploading
                    ? "Parsing Text..."
                    : analyzing
                    ? "AI Structuring..."
                    : "Extract & Analyze Profile"}
                </span>
              </button>
              <button
                onClick={() => setFile(null)}
                disabled={uploading || analyzing}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              Select File from Computer
            </button>
          )}
        </div>
      </div>

      {/* Grounding & Verification Notice */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-400">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">Strict Anti-Hallucination Policy:</span>{" "}
          JobHunter AI strictly enforces grounding. The system will never fabricate dates, employers, certifications, degrees, or quantitative metrics. Review and refine your candidate profile below to ensure tailored materials accurately emphasize your real strengths.
        </div>
      </div>

      {/* Extracted Profile View & Editor */}
      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/20">
          Loading candidate profile...
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Contact & Personal Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-400">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Professional Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Section 2: Skills with Interactive Tags */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-400" />
              <span>Skills & Competencies ({skills.length})</span>
            </h2>

            {/* Add Skill Input */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add a verified skill (e.g. TypeScript, Docker)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 group"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(sk)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Work Experience */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Verified Work Experience ({experience.length})</span>
            </h2>

            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-white text-sm">
                      {exp.role || "Role"} at {exp.company || "Company"}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {exp.start_date || ""} — {exp.end_date || "Present"}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-xs text-zinc-500">{exp.location}</p>
                  )}
                  {Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pt-1">
                      {exp.highlights.map((hl: string, hIdx: number) => (
                        <li key={hIdx}>{hl}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Education */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span>Education & Credentials ({education.length})</span>
            </h2>

            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white text-sm">
                      {edu.degree || "Degree"} in {edu.field || "Field"}
                    </span>
                    <p className="text-xs text-zinc-400">{edu.institution || "Institution"}</p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {edu.graduation_year || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Resume Uploaded Yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Upload your PDF or Word resume above to begin intelligent matching and tailored applications.
          </p>
        </div>
      )}
    </div>
  );
}
