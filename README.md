# JobHunter AI — Autonomous AI Job Search & Application Assistant

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google GenAI SDK](https://img.shields.io/badge/AI%20SDK-google--genai%20v2.22-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-56%20Passed-emerald)](https://pytest.org)
[![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-purple)](https://jwt.io)

**JobHunter AI** is an enterprise-grade, local-first, autonomous career intelligence system designed to help candidates discover high-match opportunities, bridge skill gaps, generate tailored application materials with zero hallucination, manage their job application lifecycle, and provide multi-tenant data isolation and administrative governance.

Powered by **Google Gemini API** (`google-genai` SDK) with support for `gemini-3.7-flash` (and fallback to `gemini-2.5-flash`), plus a high-fidelity local deterministic **MockProvider** that guarantees 100% functionality without requiring an external API key.

---

## 🌟 Key Features

### 1. Authentication, Multi-Tenant Data Isolation & RBAC
- **Secure Authentication:** User registration, password hashing with `bcrypt`, and stateless JWT token issuance (`HS256`).
- **Default Public Role:** All public registrations strictly default to `role="user"` preventing privilege escalation.
- **Strict User Data Isolation:** User A cannot access or tamper with User B's resumes, profiles, preferences, applications, documents, or AI activity logs. Cross-user access returns `404 Not Found` or `403 Forbidden`.
- **Admin Command Center (`/admin`):** Dedicated administrative console for platform-wide KPI monitoring, user status management (activate/deactivate), role promotion/demotion, and system diagnostics with self-lockout safeguards.
- **Default Seeded Admin Account:**
  - **Email:** `admin@jobhunter.ai`
  - **Password:** `AdminJobHunter2026!`

### 2. Resume Ingestion & Parsing
- **Format Support:** Drag-and-drop support for PDF (`pypdf`) and Word (`python-docx`) documents.
- **Corrupted Document Detection:** Validates MIME headers, file size limits (10MB), and readable text streams.
- **Candidate Profile Structuring:** Automatically extracts contact details, verified skills, structured employment history, educational credentials, organizations, and certifications into a persistent database.

### 3. Job Intelligence & Ingestion
- **Three Input Modalities:**
  1. **Paste Job Description:** Paste raw unstructured postings; the AI extracts title, company, requirements, salary, and responsibilities.
  2. **Respectful URL Scraper:** Fetches public career postings using `httpx` and `BeautifulSoup4`, honors timeouts, sanitizes content, and extracts structured job entities.
  3. **Manual Entry:** Direct structured entry for customized roles.
- **Sample Job Seeder:** Pre-seeded with 4 industry benchmark roles (Stripe, Datadog, Linear, Airbnb) for immediate testing.

### 4. Explainable 5-Dimension Compatibility Matching
A transparent scoring algorithm comparing candidates against role requirements:
- **Skills Match (40%):** Weighted overlap across technical skills, frameworks, and programming languages.
- **Experience Match (25%):** Candidate years and seniority relative to job requirements.
- **Responsibilities Match (20%):** Semantic alignment with day-to-day execution duties.
- **Education Match (10%):** Degree level and field relevancy.
- **Keywords Match (5%):** ATS keyword coverage and domain terminology.
- Provides actionable pros, cons, and a qualitative hiring recommendation.

### 5. 4-Category Skill Gap Matrix & Actionable Roadmap
Categorizes all job requirements into 4 distinct quadrants:
1. `Already Strong` (Candidate verified skills matching role requirements)
2. `Some Experience` (Adjacent skills requiring minor ramp-up)
3. `Needs Improvement` (Identified gaps to study or emphasize in interview prep)
4. `Missing` (Required competencies where candidate has zero reported experience)
Includes a tailored **Actionable Learning Roadmap** and **Interview Focus Points**.

### 6. Grounded Tailored Resumes & Cover Letters
- **Strict Anti-Hallucination Policy:** The system enforces strict factual grounding. The AI may reorder, emphasize, and highlight genuine accomplishments, but is mathematically prevented from inventing companies, degrees, dates, metrics, certifications, or unverified skills.
- **Grounded Cover Letters:** 3-paragraph authentic letters written in the candidate's voice addressing the target company's specific technical challenges.
- **Document Center:** Split-view Markdown editor with live preview, word count, copy to clipboard, and `.md` file export.

### 7. 8-Stage Application Lifecycle Kanban Tracker
Manage your search across 8 standard recruitment stages:
1. `Wishlist`
2. `Applied`
3. `Screening`
4. `Interview`
5. `Technical Interview`
6. `Final Interview`
7. `Offer`
8. `Rejected`
Features drag-free stage movement, interview dates, salary tracking, notes, and a toggleable tabular List View.

### 8. Real-Time AI Observability & Evaluation Dashboard
Telemetry dashboard tracking:
- **Hallucination Rate (0.0%):** Monitored through anti-hallucination verification hooks.
- **ATS Keyword Alignment Score (92.5%):** Quantifying role keyword parity.
- **Agent Latency Breakdown:** Execution duration (ms) for `ResumeAgent`, `JobAgent`, `MatchAgent`, `RecommendationAgent`, `ResumeTailorAgent`, and `CoverLetterAgent`.
- **Live Telemetry Stream:** Audit log capturing agent actions, models, timestamps, and status.

### 9. 1-Click Autonomous Pipeline
A unified orchestration agent (`Orchestrator`) that runs:
```
Match Candidate -> Compute Skill Gap -> Tailor Grounded Resume -> Write Cover Letter -> Track in Kanban
```
in a single click.

---

## 🏗️ Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │      JobHunter AI Frontend (Next.js)   │
                                  │   TypeScript • Tailwind • App Router   │
                                  └───────────────────┬────────────────────┘
                                                      │ HTTP / REST API (v1) Bearer JWT
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │       FastAPI Orchestration Layer      │
                                  │     Auth / RBAC / Multi-Tenant Scoping │
                                  └─┬──────────────┬──────────────┬────────┘
                                    │              │              │
                   ┌────────────────▼┐    ┌────────▼────────┐   ┌─▼────────────────┐
                   │ Specialized     │    │  SQLAlchemy ORM │   │  Observability   │
                   │ Multi-Agents    │    │  SQLite Engine  │   │  Telemetry Log   │
                   └────────┬────────┘    └─────────────────┘   └──────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
   ┌───────────────────────┐   ┌──────────────────────────┐
   │ Google Gemini SDK     │   │ High-Fidelity Mock       │
   │ (gemini-3.7-flash)    │   │ Deterministic Provider   │
   │ (gemini-2.5-flash)    │   │ (Zero API Key Needed)    │
   └───────────────────────┘   └──────────────────────────┘
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- (Optional) Docker & Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/kangguruhdq-ux/ai-hunter-job.git
cd ai-hunter-job
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Build & run development server (runs on http://localhost:3000)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Default Credentials & Role Access

When the application boots for the first time, an administrator account is automatically seeded into the database:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@jobhunter.ai` | `AdminJobHunter2026!` | Full platform access, Admin Command Center (`/admin`), User Management, Diagnostics. |
| **User** | *(Self-registered via `/register`)* | *(Configured by user)* | Private Candidate Profile, Resumes, Matches, Kanban, Documents. |

---

## 🐳 Docker Deployment

To launch the complete application stack with a single command:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Interactive Swagger Docs:** http://localhost:8000/docs

---

## ⚙️ Configuration & Environment Variables

Configure backend behavior in `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `mock` | AI engine to use: `gemini` for Google Gemini or `mock` for local deterministic engine. |
| `GEMINI_API_KEY` | *(empty)* | Google GenAI API Key (Required only if `AI_PROVIDER=gemini`). |
| `GEMINI_MODEL` | `gemini-3.7-flash` | Primary Gemini model. |
| `GEMINI_FALLBACK_MODEL`| `gemini-2.5-flash` | Fallback model if primary exceeds rate limits. |
| `JWT_SECRET_KEY` | *(generated)* | Secret key for JWT HS256 signing. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Access token lifespan (7 days). |
| `DATABASE_URL` | `sqlite:///./data/jobhunter.db` | SQLAlchemy database connection URI. |
| `ENVIRONMENT` | `development` | Environment mode (`development`, `production`). |

> **Security Note:** The `GEMINI_API_KEY` and `JWT_SECRET_KEY` are exclusively managed on the backend and are never exposed to the client or frontend bundles.

---

## 🧪 Testing

The backend includes a comprehensive automated test suite (**56 automated tests** with 100% pass rate) covering auth, RBAC, multi-tenant isolation, AI agents, data models, matching algorithms, anti-hallucination guardrails, and end-to-end pipelines:

```bash
cd backend
pytest -v
```

### Test Coverage Breakdown:
- `test_auth.py` (10 tests): User registration, duplicate email rejection, bcrypt verification, JWT token issuance, token expiration, logout blacklist, and inactive user rejection.
- `test_auth_and_isolation.py` (5 tests): Multi-tenant user data boundaries (User A vs. User B isolation across resumes, profiles, applications, and documents) and RBAC admin endpoint protection (`403 Forbidden` for regular users).
- `test_ai_provider.py`: Gemini structured output parsing, error handling, mock fallback.
- `test_resume_parser.py`: PDF and DOCX extraction, text sanitation, corruption handling.
- `test_profile_extraction.py`: Structuring raw text into Pydantic models.
- `test_ground_truth_cvs.py`: Real-world Ground Truth CV testing (Mahabbah & Anindito profiles) enforcing strict anti-hallucination rules.
- `test_job_agent.py`: HTML scraping, entity extraction, job deduplication.
- `test_matching_engine.py`: 5-dimension deterministic scoring formulas.
- `test_skill_gap_analysis.py`: 4-category classification and learning roadmaps.
- `test_resume_tailoring.py`: Anti-hallucination verification and factual grounding checks.
- `test_cover_letter.py`: 3-paragraph authentic letter generation.
- `test_application_tracker.py`: 8-stage Kanban transitions, interview dates, salary tracking.
- `test_dashboard_and_activity.py`: Telemetry logs, latency statistics, and KPI aggregations.
- `test_e2e_pipeline.py`: Full autonomous 1-click end-to-end integration test.

---

## 📖 API Reference

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### Authentication & User Management
| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | Register a new user account (defaults to `role="user"`) |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user and receive Bearer JWT token |
| `/api/v1/auth/logout` | `POST` | Authenticated | Invalidate current session |
| `/api/v1/auth/me` | `GET` | Authenticated | Retrieve authenticated user profile |
| `/api/v1/admin/stats` | `GET` | Admin | Retrieve platform-wide aggregate statistics |
| `/api/v1/admin/users` | `GET` | Admin | Search, filter, and paginate all platform users |
| `/api/v1/admin/users/{id}/status` | `PATCH` | Admin | Update user active status or promote/demote role |
| `/api/v1/admin/ai-metrics` | `GET` | Admin | Retrieve platform AI observability metrics |
| `/api/v1/admin/system-health` | `GET` | Admin | System operational diagnostics and health check |

### Candidate Profile & AI Workflow
| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/resume/upload` | `POST` | Authenticated | Upload and parse resume (PDF / DOCX) scoped to user |
| `/api/v1/candidate/profile` | `GET` / `PUT` | Authenticated | Retrieve or edit candidate profile |
| `/api/v1/candidate/preferences` | `GET` / `PUT` | Authenticated | Manage career preferences and AI memory |
| `/api/v1/jobs` | `GET` / `POST` | Authenticated | List jobs, search, or ingest pasted text |
| `/api/v1/jobs/import-url` | `POST` | Authenticated | Scrape and parse public job posting URL |
| `/api/v1/jobs/seed` | `POST` | Authenticated | Seed 4 sample industry benchmark jobs |
| `/api/v1/jobs/{id}/match` | `GET` / `POST` | Authenticated | Deterministic 5-dimension compatibility score |
| `/api/v1/jobs/{id}/skill-gap` | `GET` | Authenticated | 4-category skill gap matrix and roadmap |
| `/api/v1/jobs/{id}/tailored-resume` | `GET` / `POST` | Authenticated | Generate grounded tailored resume |
| `/api/v1/jobs/{id}/cover-letter` | `GET` / `POST` | Authenticated | Generate authentic 3-paragraph cover letter |
| `/api/v1/documents` | `GET` | Authenticated | List user's generated application documents |
| `/api/v1/documents/{id}` | `GET` / `PUT` | Authenticated | Retrieve or edit Markdown document |
| `/api/v1/documents/{id}/download` | `GET` | Authenticated | Download document as `.md` file |
| `/api/v1/applications/kanban` | `GET` | Authenticated | Retrieve 8-stage Kanban application board |
| `/api/v1/applications` | `POST` / `PATCH` | Authenticated | Create or update application stage and notes |
| `/api/v1/ai/dashboard-stats` | `GET` | Authenticated | Candidate dashboard summarized KPIs |
| `/api/v1/ai/evaluation` | `GET` | Authenticated | AI observability metrics and agent latencies |
| `/api/v1/ai/pipeline/{job_id}` | `POST` | Authenticated | Execute 1-click end-to-end autonomous pipeline |

---

## 🛡️ Anti-Hallucination Policy

JobHunter AI adheres to an uncompromising anti-hallucination standard:
1. **Source of Truth:** The candidate's verified profile extracted from their master resume is the sole source of factual record.
2. **Strict Grounding:** The system will never fabricate companies, employment dates, degrees, certifications, unverified skills, or metrics.
3. **Re-framing vs. Invention:** The AI is permitted only to emphasize, reorganize, and articulate existing verified candidate experience using vocabulary aligned with the target job description.
4. **Automated Verification:** All generated resumes undergo an automated post-generation grounding check (`anti_hallucination_verified`) before being saved.

---

## 📄 License

This project is licensed under the MIT License.
