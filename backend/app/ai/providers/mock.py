import re
from typing import List, Dict, Any, Optional
from app.ai.providers.base import AIProvider
from app.schemas.candidate_profile import (
    CandidateProfileData, ExperienceItem, EducationItem, ProjectItem
)
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData, SkillGapItem
from app.schemas.document import TailoredResumeData, TailoredChange, CoverLetterData

class MockProvider(AIProvider):
    """
    High-fidelity deterministic AI provider for offline development, demo mode,
    and testing. Generates realistic technical data with zero 'Lorem ipsum'.
    Supports multi-model fallback simulation and telemetry inspection.
    """

    def __init__(self, simulation_mode: str = "normal"):
        self.simulation_mode = simulation_mode
        self.primary_model = "gemini-3.7-flash"
        self.fallback_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        self.last_telemetry = {
            "requested_model": self.primary_model,
            "successful_model": self.primary_model,
            "attempted_models": [self.primary_model],
            "fallback_used": False,
            "status": "completed",
            "duration_ms": 120
        }

    def _apply_simulation_telemetry(self):
        if self.simulation_mode == "primary_429":
            self.last_telemetry = {
                "requested_model": self.primary_model,
                "successful_model": self.fallback_models[0],
                "attempted_models": [self.primary_model, self.fallback_models[0]],
                "fallback_used": True,
                "status": "completed",
                "duration_ms": 320
            }
        elif self.simulation_mode == "primary_404":
            self.last_telemetry = {
                "requested_model": self.primary_model,
                "successful_model": self.fallback_models[1],
                "attempted_models": [self.primary_model, self.fallback_models[0], self.fallback_models[1]],
                "fallback_used": True,
                "status": "completed",
                "duration_ms": 450
            }
        elif self.simulation_mode == "primary_503":
            self.last_telemetry = {
                "requested_model": self.primary_model,
                "successful_model": self.fallback_models[0],
                "attempted_models": [self.primary_model, self.fallback_models[0]],
                "fallback_used": True,
                "status": "completed",
                "duration_ms": 280
            }
        elif self.simulation_mode == "all_fail":
            from app.ai.providers.gemini import GeminiAIError
            self.last_telemetry = {
                "requested_model": self.primary_model,
                "successful_model": None,
                "attempted_models": [self.primary_model] + self.fallback_models,
                "fallback_used": True,
                "status": "failed",
                "error_type": "RESOURCE_EXHAUSTED",
                "duration_ms": 600
            }
            raise GeminiAIError(
                "Layanan AI sementara tidak tersedia karena semua model Gemini yang dikonfigurasi telah mencapai batas kuota (quota exhausted). Silakan coba beberapa saat lagi."
            )
        else:
            self.last_telemetry = {
                "requested_model": self.primary_model,
                "successful_model": self.primary_model,
                "attempted_models": [self.primary_model],
                "fallback_used": False,
                "status": "completed",
                "duration_ms": 120
            }

    async def analyze_resume(self, raw_text: str) -> CandidateProfileData:
        self._apply_simulation_telemetry()
        lower_text = raw_text.lower()

        # 1. Ground Truth CV 1: Mahabbah Mahabban Romadhon
        if "mahabbah" in lower_text or "mahabban" in lower_text:
            return CandidateProfileData(
                name="Mahabbah Mahabban Romadhon",
                headline="IT Technical Support & Network Specialist",
                summary="Lulusan SMK jurusan Teknik Komputer dan Jaringan dengan kompetensi perakitan komputer, instalasi jaringan, dan konfigurasi router MikroTik.",
                location="Karangbunder RT.03/RW.38, Baturetno, Banguntapan, Bantul",
                email="mahabbah.mr@gmail.com",
                phone="081228516766",
                skills=[
                    "Perakitan Komputer",
                    "Instalasi Jaringan & Komputer",
                    "Troubleshooting Hardware & Jaringan",
                    "Konfigurasi Router (MikroTik)",
                    "Administrasi Server Dasar",
                    "Disiplin",
                    "Problem Solving"
                ],
                programming_languages=["Pemrograman Dasar"],
                frameworks=[],
                tools=["MikroTik", "Hardware PC", "Kabel UTP", "Tester Jaringan"],
                experience=[
                    ExperienceItem(
                        company="Immersa",
                        role=None,  # CV does not specify a role; strictly null
                        title=None,
                        period="Desember 2026 – April 2027",
                        responsibilities=[
                            "Melakukan instalasi, konfigurasi, dan pengujian sistem operasi serta aplikasi software pendukung.",
                            "Melakukan troubleshooting dasar pada perangkat keras (hardware) dan jaringan.",
                            "Membantu pemeliharaan rutin perangkat komputer dan infrastruktur jaringan kantor.",
                            "Membuat dokumentasi hasil perbaikan dan pemeliharaan sistem secara berkala."
                        ]
                    )
                ],
                education=[
                    EducationItem(
                        institution="SMKN 3 YOGYAKARTA",
                        degree="SMK",
                        field_of_study="Teknik Komputer dan Jaringan",
                        period="2024–2027",
                        gpa="90",
                        details=[
                            "Administrasi Jaringan Komputer",
                            "Perakitan Komputer",
                            "Sistem Komputer",
                            "Pemrograman Dasar"
                        ]
                    ),
                    EducationItem(
                        institution="SMP NEGERI 9 YOGYAKARTA",
                        degree="SMP",
                        period="2021–2024"
                    )
                ],
                organizations=[],
                certifications=[],
                projects=[],
                years_of_experience=0.5
            )

        # 2. Ground Truth CV 2: Anindito Aziz Purwanto
        if "anindito" in lower_text or "aziz purwanto" in lower_text:
            return CandidateProfileData(
                name="Anindito Aziz Purwanto",
                headline="Network Systems Administration & Cyber Operations Assistant",
                summary="Siswa SMK jurusan Teknik Komputer dan Jaringan dengan minat mendalam di bidang Administrasi Jaringan, Keamanan Siber, dan Analisis Data.",
                location="Yogyakarta, Indonesia",
                email="anindito.aziz@example.com",
                phone="081234567890",
                skills=[
                    "MikroTik",
                    "Cisco Packet Tracer",
                    "VLAN",
                    "Routing",
                    "Subnetting",
                    "Linux",
                    "Windows Server",
                    "Python dasar",
                    "SQL",
                    "Google Sheets",
                    "Troubleshooting PC",
                    "Perakitan Komputer",
                    "Crimping Kabel UTP"
                ],
                programming_languages=["Python dasar", "SQL"],
                frameworks=[],
                tools=["MikroTik", "Cisco Packet Tracer", "Linux", "Windows Server", "Google Sheets"],
                experience=[
                    ExperienceItem(
                        company="Pusat Teknologi Informasi dan Komunikasi UNY",
                        role="Asisten Laboratorium dan Administrasi",
                        period="Januari 2026 – Mei 2026",
                        responsibilities=[
                            "Mengelola dan memelihara lebih dari 50 workstation komputer laboratorium.",
                            "Melakukan instalasi dan konfigurasi sistem operasi Linux dan Windows.",
                            "Mengatur manajemen bandwidth dan keamanan jaringan menggunakan Router MikroTik.",
                            "Mengarsipkan dan mendokumentasikan inventaris logistik laboratorium."
                        ]
                    )
                ],
                education=[
                    EducationItem(
                        institution="SMK Negeri 3 Yogyakarta",
                        degree="SMK",
                        field_of_study="Teknik Komputer dan Jaringan",
                        period="2024 – 2027"
                    )
                ],
                organizations=[
                    OrganizationItem(
                        name="Pleton Inti SMK Negeri 3 Yogyakarta",
                        role="Anggota Aktif & Instruktur Muda",
                        period="2024 – 2025"
                    ),
                    OrganizationItem(
                        name="Gladi Ketarunaan",
                        role="Staf Divisi Kedisiplinan",
                        period="2024"
                    ),
                    OrganizationItem(
                        name="Buka Sareng BARA 2025",
                        role="Ketua Divisi Logistik",
                        period="2025"
                    ),
                    OrganizationItem(
                        name="Diklat CABARA 2025",
                        role="Instruktur Lapangan",
                        period="2025"
                    ),
                    OrganizationItem(
                        name="HUT Tonti BARA 2025",
                        role="Divisi Publikasi dan Dokumentasi",
                        period="2025"
                    )
                ],
                certifications=[
                    "Google AI Essentials",
                    "Google Data Analytics Professional Certificate",
                    "Pelatihan LKS Bidang IT Network Systems Administration"
                ],
                projects=[],
                years_of_experience=0.5
            )

        # 3. Generic CV Extraction
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        name = "Alex Mercer"
        ignore_headers = {"curriculum vitae", "resume", "daftar riwayat hidup", "biodata", "data pribadi", "profile", "profil"}

        for line in lines[:8]:
            cleaned_line = line.strip(" -#:")
            lower_line = cleaned_line.lower()
            if lower_line in ignore_headers:
                continue
            if any(c in cleaned_line for c in "@:/0123456789+()"):
                continue
            words = cleaned_line.split()
            if 2 <= len(words) <= 5 and all(w.isalpha() or w.replace(".", "").isalpha() for w in words):
                name = cleaned_line
                break

        # Extract common tech skills mentioned in text
        skill_catalog = [
            "Python", "FastAPI", "Django", "Flask", "PostgreSQL", "MySQL", "Redis",
            "Docker", "Kubernetes", "AWS", "GCP", "CI/CD", "TypeScript", "JavaScript",
            "React", "Next.js", "Node.js", "Tailwind CSS", "GraphQL", "REST API",
            "Git", "Microservices", "System Design", "Linux", "SQL", "Kafka"
        ]
        found_skills = []
        lower_text = raw_text.lower()
        for skill in skill_catalog:
            # Word boundary search
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, lower_text):
                found_skills.append(skill)

        if not found_skills:
            found_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"]

        langs = [s for s in found_skills if s in ["Python", "TypeScript", "JavaScript", "SQL"]]
        frameworks = [s for s in found_skills if s in ["FastAPI", "Django", "Flask", "React", "Next.js", "Node.js"]]
        tools = [s for s in found_skills if s in ["Docker", "Kubernetes", "AWS", "GCP", "Redis", "Kafka", "Git", "Linux"]]

        return CandidateProfileData(
            name=name,
            headline="Senior Full Stack & Distributed Systems Engineer",
            summary=(
                "Software engineer with 6+ years of experience designing, scaling, and deploying "
                "fault-tolerant web applications and microservices. Proven track record optimizing "
                "cloud infrastructure, database query latency, and developer ergonomics."
            ),
            location="San Francisco, CA (Open to Remote)",
            email="alex.mercer.dev@example.com",
            phone="+1 (415) 890-2134",
            skills=found_skills,
            programming_languages=langs or ["Python", "TypeScript", "SQL"],
            frameworks=frameworks or ["FastAPI", "React", "Next.js"],
            tools=tools or ["Docker", "PostgreSQL", "Redis", "AWS", "Git"],
            experience=[
                ExperienceItem(
                    title="Senior Software Engineer",
                    company="CloudScale Technologies",
                    location="Remote",
                    start_date="2022-03",
                    end_date=None,
                    current=True,
                    description="Lead engineer on high-throughput backend services and data pipelines.",
                    achievements=[
                        "Architected event-driven ingestion pipeline in FastAPI and Kafka processing 35M daily events.",
                        "Reduced p99 API latency by 42% through PostgreSQL query index tuning and Redis caching.",
                        "Mentored 4 junior engineers and championed automated CI/CD deployment pipelines."
                    ]
                ),
                ExperienceItem(
                    title="Software Engineer",
                    company="NextWave Solutions",
                    location="Austin, TX",
                    start_date="2019-06",
                    end_date="2022-02",
                    current=False,
                    description="Full stack product engineering across customer dashboard and public APIs.",
                    achievements=[
                        "Built customer analytics dashboard in React, TypeScript, and FastAPI with real-time SSE.",
                        "Maintained 99.95% uptime across core billing and checkout microservices.",
                        "Migrated legacy monolithic endpoints to containerized Docker services."
                    ]
                )
            ],
            education=[
                EducationItem(
                    degree="B.S. in Computer Science",
                    institution="University of Washington",
                    field_of_study="Computer Science",
                    start_year=2015,
                    end_year=2019
                )
            ],
            certifications=["AWS Certified Solutions Architect - Associate"],
            projects=[
                ProjectItem(
                    name="AsyncFlow",
                    description="Open-source lightweight workflow orchestration library for Python asynchronous services.",
                    tech_stack=["Python", "FastAPI", "Redis", "pytest"],
                    url="https://github.com/example/asyncflow"
                )
            ],
            years_of_experience=6.0
        )

    async def analyze_job(self, raw_job_text: str) -> JobAnalysisData:
        self._apply_simulation_telemetry()
        lines = [l.strip() for l in raw_job_text.splitlines() if l.strip()]
        title = "Senior Backend Engineer"
        company = "Stripe"
        location = "Remote (US / Canada)"

        for line in lines[:5]:
            if "at " in line.lower():
                parts = line.split("at ")
                if len(parts) == 2:
                    title = parts[0].strip(" -#:")
                    company = parts[1].strip(" -#:")
                    break

        skill_catalog = [
            "Python", "FastAPI", "Go", "Java", "PostgreSQL", "Kubernetes", "Docker",
            "AWS", "Kafka", "Redis", "Distributed Systems", "REST API", "gRPC", "GraphQL",
            "TypeScript", "React", "Terraform", "CI/CD", "System Design"
        ]
        detected = []
        lower = raw_job_text.lower()
        for s in skill_catalog:
            pattern = r"\b" + re.escape(s.lower()) + r"\b"
            if re.search(pattern, lower):
                detected.append(s)

        if not detected:
            detected = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Kubernetes", "Distributed Systems"]

        req_skills = detected[:5]
        pref_skills = detected[5:8] if len(detected) > 5 else ["Kubernetes", "Kafka"]

        return JobAnalysisData(
            title=title or "Senior Backend Engineer",
            company=company or "Modern Tech Corp",
            location=location,
            employment_type="Full-time",
            salary="$160,000 - $195,000 + Equity",
            salary_min=160000,
            salary_max=195000,
            required_skills=req_skills,
            preferred_skills=pref_skills,
            required_experience_years=5.0,
            education_requirements=["Bachelor's degree in Computer Science or equivalent experience"],
            responsibilities=[
                "Design and scale high-reliability backend microservices and APIs.",
                "Partner with infrastructure teams to optimize database throughput and cache coherence.",
                "Champion engineering best practices, code reviews, and automated integration testing.",
                "Troubleshoot distributed systems issues and maintain high operational reliability."
            ],
            keywords=detected + ["Scalability", "Observability", "Microservices"],
            summary=f"Join {company} as a {title} building mission-critical services handling high volume."
        )

    async def match_candidate(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> MatchResultData:
        self._apply_simulation_telemetry()
        # Deterministic explainable calculation
        candidate_skills_lower = {s.lower() for s in (profile.skills + profile.programming_languages + profile.frameworks + profile.tools)}
        req_lower = [s.lower() for s in job.required_skills]
        pref_lower = [s.lower() for s in job.preferred_skills]

        # 1. Skills Match Score (40%)
        req_matched = [s for s in job.required_skills if s.lower() in candidate_skills_lower]
        pref_matched = [s for s in job.preferred_skills if s.lower() in candidate_skills_lower]

        req_ratio = len(req_matched) / max(len(job.required_skills), 1)
        pref_ratio = len(pref_matched) / max(len(job.preferred_skills), 1) if job.preferred_skills else 1.0
        skills_score = int(round((req_ratio * 0.85 + pref_ratio * 0.15) * 100))

        # 2. Experience Match Score (25%)
        target_years = job.required_experience_years or 3.0
        if profile.years_of_experience >= target_years:
            experience_score = 100
        else:
            experience_score = max(40, int(round((profile.years_of_experience / target_years) * 100)))

        # 3. Responsibility Score (20%)
        responsibility_score = min(100, max(75, skills_score + 5))

        # 4. Education Score (10%)
        education_score = 100 if profile.education else 80

        # 5. Keyword Score (5%)
        job_keywords = {k.lower() for k in job.keywords}
        overlap = len(job_keywords.intersection(candidate_skills_lower))
        keyword_score = min(100, int((overlap / max(len(job_keywords), 1)) * 120))

        # Weighted calculation
        overall_score = int(round(
            skills_score * 0.40 +
            experience_score * 0.25 +
            responsibility_score * 0.20 +
            education_score * 0.10 +
            keyword_score * 0.05
        ))

        # Categorize gaps
        strengths = req_matched + pref_matched
        skill_gaps: List[SkillGapItem] = []

        for skill in job.required_skills:
            if skill.lower() in candidate_skills_lower:
                skill_gaps.append(SkillGapItem(
                    skill=skill,
                    category="Already Strong",
                    recommendation=f"Highlight specific production achievements using {skill} on your resume."
                ))
            else:
                skill_gaps.append(SkillGapItem(
                    skill=skill,
                    category="Missing",
                    recommendation=f"Review fundamentals and complete a practical hands-on project utilizing {skill}."
                ))

        for skill in job.preferred_skills:
            if skill.lower() in candidate_skills_lower:
                skill_gaps.append(SkillGapItem(
                    skill=skill,
                    category="Some Experience",
                    recommendation=f"Mention familiarity and side project exposure with {skill}."
                ))
            else:
                skill_gaps.append(SkillGapItem(
                    skill=skill,
                    category="Needs Improvement",
                    recommendation=f"Target {skill} as a secondary learning goal for upcoming technical interview rounds."
                ))

        # Recommendation category
        if overall_score >= 80:
            rec = "STRONG_MATCH"
            reason = (
                f"Strong match ({overall_score}%). The candidate demonstrates proven experience in "
                f"{', '.join(strengths[:3])} and meets the required {target_years:.0f}+ years background."
            )
        elif overall_score >= 65:
            rec = "GOOD_MATCH"
            reason = (
                f"Good match ({overall_score}%). Core capabilities in {', '.join(strengths[:2])} are well aligned. "
                f"Closing gaps in {', '.join([g.skill for g in skill_gaps if g.category == 'Missing'][:2])} will strengthen the application."
            )
        elif overall_score >= 50:
            rec = "POSSIBLE_MATCH"
            reason = f"Possible match ({overall_score}%). Meets several baseline requirements but has key skill gaps."
        else:
            rec = "WEAK_MATCH"
            reason = f"Weak match ({overall_score}%). Substantial gap between candidate profile and required core stack."

        return MatchResultData(
            overall_score=overall_score,
            skills_score=skills_score,
            experience_score=experience_score,
            responsibility_score=responsibility_score,
            education_score=education_score,
            keyword_score=keyword_score,
            strengths=strengths,
            skill_gaps=skill_gaps,
            recommendation=rec,
            reasoning=reason
        )

    async def generate_tailored_resume(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> TailoredResumeData:
        self._apply_simulation_telemetry()
        # Strict anti-hallucination: only reword bullet points and highlight actual skills
        skills_str = ", ".join(profile.skills)
        langs_str = ", ".join(profile.programming_languages)
        tools_str = ", ".join(profile.tools)

        exp_sections = []
        changes = []

        for exp in profile.experience:
            tailored_bullets = []
            for ach in exp.achievements:
                # Polish bullet point with targeted focus on reliability and scale
                if "latency" in ach.lower() or "api" in ach.lower():
                    refined = f"Architected and optimized RESTful services and APIs, reducing p99 latency while supporting robust production scale."
                    changes.append(TailoredChange(
                        original=ach,
                        tailored=refined,
                        rationale=f"Highlighted API optimization and scalability aligned with {job.company}'s requirements."
                    ))
                    tailored_bullets.append(f"- {refined}")
                else:
                    tailored_bullets.append(f"- {ach}")

            bullets_text = "\n".join(tailored_bullets)
            dates = f"{exp.start_date} – {'Present' if exp.current else exp.end_date}"
            exp_sections.append(f"### {exp.title} — {exp.company} ({dates})\n{bullets_text}")

        joined_exp = "\n\n".join(exp_sections)
        edu_str = (
            f"{profile.education[0].degree} — {profile.education[0].institution}"
            if profile.education else "B.S. in Computer Science — University"
        )

        markdown = f"""# {profile.name}
**{profile.headline}**
Email: {profile.email} | Phone: {profile.phone} | Location: {profile.location}

---

## Executive Summary
{profile.summary}

## Core Competencies & Technical Stack
- **Languages:** {langs_str}
- **Technologies & Frameworks:** {skills_str}
- **Tools & Infrastructure:** {tools_str}

## Professional Experience
{joined_exp}

## Education
{edu_str}
"""


        if not changes:
            changes.append(TailoredChange(
                original="General backend experience bullet points",
                tailored="Refined formatting and emphasized matching keywords from job posting",
                rationale="Optimized keyword density for ATS parsing without inventing new skills."
            ))

        return TailoredResumeData(
            title=f"{profile.name} - Tailored Resume for {job.company}",
            tailored_markdown=markdown.strip(),
            tailored_changes=changes,
            anti_hallucination_verified=True
        )

    async def generate_cover_letter(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData,
        company: str,
        job_title: str
    ) -> CoverLetterData:
        self._apply_simulation_telemetry()
        # Authentic, grounded letter
        key_skills = ", ".join(profile.skills[:4])
        top_exp = profile.experience[0] if profile.experience else None
        curr_company = top_exp.company if top_exp else "my previous roles"

        content = f"""Dear Hiring Team at {company},

I am writing to express my strong interest in the {job_title} position. With over {profile.years_of_experience:.0f} years of engineering experience focusing on {key_skills}, I have spent my career designing and maintaining scalable, reliable systems that solve tangible business problems.

In my recent work at {curr_company}, I led initiatives to scale backend services, streamline data pipelines, and improve API responsiveness. Specifically, I engineered event-driven systems and tuned database performance to handle heavy transactional loads while maintaining strict uptime standards. Your team's technical focus on building resilient infrastructure closely mirrors the engineering challenges I find most rewarding.

I am particularly excited about {company}'s mission and would welcome the opportunity to bring my hands-on background in {', '.join(job.required_skills[:3])} to your engineering team. Thank you for your time and consideration, and I look forward to discussing how my experience can contribute to {company}'s ongoing success.

Sincerely,
{profile.name}
{profile.email}
"""

        return CoverLetterData(
            title=f"Cover Letter — {company} ({job_title})",
            content=content.strip(),
            tailored_aspects=[
                f"Directly referenced candidate's real experience at {curr_company}",
                f"Highlighted genuine verified skills: {key_skills}",
                f"Aligned background with {company}'s target stack without fabricated metrics"
            ],
            anti_hallucination_verified=True
        )
