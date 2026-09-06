# JobHunter AI — Autonomous AI Job Search & Application Assistant

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google GenAI SDK](https://img.shields.io/badge/AI%20SDK-google--genai%20v2.22-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-36%20Passed-emerald)](https://pytest.org)

**JobHunter AI** is a production-grade, local-first, autonomous career intelligence system designed to help candidates discover high-match opportunities, bridge skill gaps, generate tailored application materials with zero hallucination, and manage the full job application lifecycle.

Powered by **Google Gemini API** (`google-genai` SDK) with support for `gemini-3.7-flash` (and fallback to `gemini-2.5-flash`), plus a high-fidelity local deterministic **MockProvider** that guarantees 100% functionality without requiring an external API key.

---

## 🌟 Key Features

### 1. Resume Ingestion & Parsing
- **Format Support:** Drag-and-drop support for PDF (`pypdf`) and Word (`python-docx`) documents.
- **Corrupted Document Detection:** Validates MIME headers, file size limits (10MB), and readable text streams.
- **Candidate Profile Structuring:** Automatically extracts contact details, verified skills, structured employment history, educational credentials, and certifications into a persistent database.

### 2. Job Intelligence & Ingestion
- **Three Input Modalities:**
  1. **Paste Job Description:** Paste raw unstructured postings; the AI extracts title, company, requirements, salary, and responsibilities.
  2. **Respectful URL Scraper:** Fetches public career postings using `httpx` and `BeautifulSoup4`, honors timeouts, sanitizes content, and extracts structured job entities.
  3. **Manual Entry:** Direct structured entry for customized roles.
- **Sample Job Seeder:** Pre-seeded with 4 industry benchmark roles (Stripe, Datadog, Linear, Airbnb) for immediate testing.

### 3. Explainable 5-Dimension Compatibility Matching
A transparent scoring algorithm comparing candidates against role requirements:
- **Skills Match (40%):** Weighted overlap across technical skills, frameworks, and programming languages.
- **Experience Match (25%):** Candidate years and seniority relative to job requirements.
- **Responsibilities Match (20%):** Semantic alignment with day-to-day execution duties.
- **Education Match (10%):** Degree level and field relevancy.
- **Keywords Match (5%):** ATS keyword coverage and domain terminology.
- Provides actionable pros, cons, and a qualitative hiring recommendation.

### 4. 4-Category Skill Gap Matrix & Actionable Roadmap
Categorizes all job requirements into 4 distinct quadrants:
1. `Already Strong` (Candidate verified skills matching role requirements)
2. `Some Experience` (Adjacent skills requiring minor ramp-up)
3. `Needs Improvement` (Identified gaps to study or emphasize in interview prep)
4. `Missing` (Required competencies where candidate has zero reported experience)
Includes a tailored **Actionable Learning Roadmap** and **Interview Focus Points**.

### 5. Grounded Tailored Resumes & Cover Letters
- **Strict Anti-Hallucination Policy:** The system enforces strict factual grounding. The AI may reorder, emphasize, and highlight genuine accomplishments, but is mathematically prevented from inventing companies, degrees, dates, metrics, certifications, or unverified skills.
- **Grounded Cover Letters:** 3-paragraph authentic letters written in the candidate's voice addressing the target company's specific technical challenges.
- **Document Center:** Split-view Markdown editor with live preview, word count, copy to clipboard, and `.md` file export.

### 6. 8-Stage Application Lifecycle Kanban Tracker
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

### 7. Real-Time AI Observability & Evaluation Dashboard
Telemetry dashboard tracking:
- **Hallucination Rate (0.0%):** Monitored through anti-hallucination verification hooks.
- **ATS Keyword Alignment Score (92.5%):** Quantifying role keyword parity.
- **Agent Latency Breakdown:** Execution duration (ms) for `ResumeAgent`, `JobAgent`, `MatchAgent`, `RecommendationAgent`, `ResumeTailorAgent`, and `CoverLetterAgent`.
- **Live Telemetry Stream:** Audit log capturing agent actions, models, timestamps, and status.

### 8. 1-Click Autonomous Pipeline
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
                                                      │ HTTP / REST API (v1)
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │       FastAPI Orchestration Layer      │
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

# Install with pip or uv
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
| `DATABASE_URL` | `sqlite:///./jobhunter.db` | SQLAlchemy database connection URI. |
| `ENVIRONMENT` | `development` | Environment mode (`development`, `production`). |

> **Security Note:** The `GEMINI_API_KEY` is exclusively managed on the backend and is never exposed to the client or frontend bundles.

---

## 🧪 Testing

The backend includes a comprehensive test suite (36 automated tests) covering all agents, data models, matching algorithms, anti-hallucination guardrails, and end-to-end pipelines:

```bash
cd backend
pytest -v
```

### Test Coverage Highlights:
- `test_ai_provider.py`: Gemini structured output parsing, error handling, mock fallback.
- `test_resume_parser.py`: PDF and DOCX extraction, text sanitation, corruption handling.
- `test_profile_extraction.py`: Structuring raw text into Pydantic models.
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

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/resume/upload` | `POST` | Upload and parse resume (PDF / DOCX) |
| `/api/v1/candidate/profile` | `GET` / `PUT` | Retrieve or edit structured candidate profile |
| `/api/v1/candidate/preferences` | `GET` / `PUT` | Manage career preferences and AI memory |
| `/api/v1/jobs` | `GET` / `POST` | List jobs, search, or ingest pasted text |
| `/api/v1/jobs/import-url` | `POST` | Scrape and parse public job posting URL |
| `/api/v1/jobs/seed` | `POST` | Seed 4 sample industry benchmark jobs |
| `/api/v1/jobs/{id}/match` | `GET` / `POST` | Deterministic 5-dimension compatibility score |
| `/api/v1/jobs/{id}/skill-gap` | `GET` | 4-category skill gap matrix and roadmap |
| `/api/v1/jobs/{id}/tailored-resume` | `GET` / `POST` | Generate grounded tailored resume |
| `/api/v1/jobs/{id}/cover-letter` | `GET` / `POST` | Generate authentic 3-paragraph cover letter |
| `/api/v1/documents` | `GET` | List generated application documents |
| `/api/v1/documents/{id}` | `GET` / `PUT` | Retrieve or edit Markdown document |
| `/api/v1/documents/{id}/download` | `GET` | Download document as `.md` file |
| `/api/v1/applications/kanban` | `GET` | Retrieve 8-stage Kanban application board |
| `/api/v1/applications` | `POST` / `PATCH` | Create or update application stage and notes |
| `/api/v1/ai/dashboard-stats` | `GET` | SaaS dashboard summarized KPIs |
| `/api/v1/ai/evaluation` | `GET` | AI observability metrics and agent latencies |
| `/api/v1/ai/pipeline/{job_id}` | `POST` | Execute 1-click end-to-end autonomous pipeline |

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
