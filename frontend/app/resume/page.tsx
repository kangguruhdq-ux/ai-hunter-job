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
  ShieldCheck,
  Award,
  Users
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
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncProfileData = (data: any) => {
    if (!data) return;
    setProfile(data);
    setFullName(data.full_name || data.name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setLocation(data.location || "");
    setSummary(data.summary || "");
    setSkills(Array.isArray(data.skills) ? data.skills : []);
    setExperience(Array.isArray(data.experience) ? data.experience : []);
    setEducation(Array.isArray(data.education) ? data.education : []);
    setOrganizations(Array.isArray(data.organizations) ? data.organizations : []);
    setCertifications(Array.isArray(data.certifications) ? data.certifications : []);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      if (data) {
        syncProfileData(data);
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
      syncProfileData(profileRes);
      
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
        organizations,
        certifications,
      });
      syncProfileData(updated);
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

  const addCert = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const removeCert = (certToRemove: string) => {
    setCertifications(certifications.filter((c) => c !== certToRemove));
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
          JobHunter AI strictly enforces factual grounding. The system will never fabricate dates, employers, roles, certifications, degrees, or quantitative metrics. If a field was omitted in your resume, it will remain blank or indicated as &quot;Tidak dicantumkan&quot;.
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
                  placeholder="Tidak dicantumkan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Email Address</label>
                <input
                  type="email"
                  placeholder="Tidak dicantumkan"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Phone</label>
                <input
                  type="text"
                  placeholder="Tidak dicantumkan"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">Location</label>
                <input
                  type="text"
                  placeholder="Tidak dicantumkan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Professional Summary</label>
              <textarea
                rows={3}
                placeholder="Tidak dicantumkan di CV"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-y placeholder:text-zinc-600"
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
                placeholder="Add a verified skill (e.g. MikroTik, Python)..."
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
              {skills.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Tidak dicantumkan</span>
              ) : (
                skills.map((sk) => (
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
                ))
              )}
            </div>
          </div>

          {/* Section 3: Work Experience */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Verified Work Experience ({experience.length})</span>
            </h2>

            {experience.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 italic">
                Tidak ada pengalaman kerja formal yang dicantumkan di CV.
              </div>
            ) : (
              <div className="space-y-4">
                {experience.map((exp, idx) => {
                  const roleTitle = exp.role || exp.title;
                  const companyName = exp.company;
                  const isGenericRole = !roleTitle || ["role", "unknown", "unknown role", "n/a", "none"].includes(roleTitle.trim().toLowerCase());
                  const isGenericCompany = !companyName || ["company", "unknown", "unknown company", "n/a", "none"].includes(companyName.trim().toLowerCase());

                  const heading = !isGenericRole && !isGenericCompany
                    ? `${roleTitle} at ${companyName}`
                    : !isGenericCompany
                    ? `${companyName} (Pengalaman Kerja / PKL)`
                    : !isGenericRole
                    ? roleTitle
                    : "Pengalaman Kerja";

                  const periodText = exp.period || 
                    (exp.start_date && exp.end_date 
                      ? `${exp.start_date} — ${exp.end_date}` 
                      : exp.start_date 
                      ? exp.start_date 
                      : exp.end_date 
                      ? exp.end_date 
                      : null);

                  const bulletPoints = (Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0)
                    ? exp.responsibilities
                    : (Array.isArray(exp.achievements) && exp.achievements.length > 0)
                    ? exp.achievements
                    : (Array.isArray(exp.highlights) && exp.highlights.length > 0)
                    ? exp.highlights
                    : [];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold text-white text-sm">
                          {heading}
                        </span>
                        {periodText && (
                          <span className="text-xs text-zinc-400 font-mono">
                            {periodText}
                          </span>
                        )}
                      </div>
                      {exp.location && (
                        <p className="text-xs text-zinc-500">{exp.location}</p>
                      )}
                      {bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pt-1">
                          {bulletPoints.map((hl: string, hIdx: number) => (
                            <li key={hIdx}>{hl}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Education */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span>Education & Academic Background ({education.length})</span>
            </h2>

            {education.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 italic">
                Tidak ada riwayat pendidikan yang dicantumkan.
              </div>
            ) : (
              <div className="space-y-3">
                {education.map((edu, idx) => {
                  const majorField = edu.field_of_study || edu.field;
                  const institutionName = edu.institution;
                  const isGenericField = !majorField || ["field", "in field", "unknown", "n/a", "none"].includes(majorField.trim().toLowerCase());
                  const isGenericDegree = !edu.degree || ["degree", "in field", "unknown", "n/a", "none"].includes(edu.degree.trim().toLowerCase());

                  const degreeTitle = !isGenericDegree && !isGenericField
                    ? `${edu.degree} — ${majorField}`
                    : !isGenericDegree
                    ? edu.degree
                    : !isGenericField
                    ? majorField
                    : institutionName || "Pendidikan";

                  const periodText = edu.period ||
                    (edu.start_date && edu.end_date
                      ? `${edu.start_date} — ${edu.end_date}`
                      : edu.graduation_year
                      ? edu.graduation_year
                      : edu.end_date || null);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold text-white text-sm">
                          {degreeTitle}
                        </span>
                        {periodText && (
                          <span className="text-xs text-zinc-400 font-mono">
                            {periodText}
                          </span>
                        )}
                      </div>
                      {edu.institution && (
                        <p className="text-xs text-zinc-400 font-medium">{edu.institution}</p>
                      )}
                      {edu.gpa && (
                        <p className="text-xs text-emerald-400 font-mono">
                          Nilai / Rata-rata: {edu.gpa}
                        </p>
                      )}
                      {Array.isArray(edu.details) && edu.details.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {edu.details.map((d: string, dIdx: number) => (
                            <span
                              key={dIdx}
                              className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Organizations & Leadership */}
          {organizations.length > 0 && (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Organizations & Leadership Activities ({organizations.length})</span>
              </h2>

              <div className="space-y-3">
                {organizations.map((org, idx) => {
                  const orgHeading = org.role && org.name
                    ? `${org.role} — ${org.name}`
                    : org.name || org.role || "Organisasi";

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold text-white text-sm">
                          {orgHeading}
                        </span>
                        {org.period && (
                          <span className="text-xs text-zinc-400 font-mono">
                            {org.period}
                          </span>
                        )}
                      </div>
                      {org.description && (
                        <p className="text-xs text-zinc-400">{org.description}</p>
                      )}
                      {Array.isArray(org.responsibilities) && org.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pt-1">
                          {org.responsibilities.map((resp: string, rIdx: number) => (
                            <li key={rIdx}>{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: Certifications & Training */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Certifications & Training ({certifications.length})</span>
            </h2>

            {/* Add Cert Input */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add certification (e.g. Google AI Essentials)..."
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCert();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addCert}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Cert Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {certifications.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Tidak dicantumkan di CV</span>
              ) : (
                certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 group"
                  >
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => removeCert(cert)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
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
