from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.logging import logger
from app.models.job import Job, JobRequirement
from app.schemas.job import (
    JobCreatePasted, JobCreateUrl, JobCreateManual, JobAnalysisData
)
from app.agents.job_agent import JobAgent, JobFetchError
from app.services.activity_service import ActivityService

class DuplicateJobError(Exception):
    """Raised when an identical job already exists."""
    pass

class JobService:
    @staticmethod
    def check_duplicate(
        db: Session,
        title: str,
        company: str,
        url: Optional[str] = None
    ) -> Optional[Job]:
        """Check if job exists by title & company or URL."""
        if url:
            existing_url = db.query(Job).filter(Job.source_url == url).first()
            if existing_url:
                return existing_url

        existing = db.query(Job).filter(
            func.lower(Job.title) == title.lower().strip(),
            func.lower(Job.company) == company.lower().strip()
        ).first()
        return existing

    @classmethod
    async def create_from_pasted(
        cls,
        db: Session,
        data: JobCreatePasted,
        user_id: Optional[str] = None
    ) -> Job:
        activity = ActivityService.start_activity(
            db=db,
            agent_name="JobAgent",
            action="analyze_pasted_job",
            user_id=user_id,
            metadata={"title": data.title, "company": data.company}
        )

        try:
            analysis: JobAnalysisData = await JobAgent.analyze_job_text(data.raw_text)

            title = data.title or analysis.title
            company = data.company or analysis.company

            # Deduplication
            dup = cls.check_duplicate(db, title, company)
            if dup:
                ActivityService.complete_activity(
                    db=db, activity_id=activity.id, status="completed",
                    metadata={"duplicate": True, "job_id": dup.id}
                )
                return dup

            job = Job(
                title=title,
                company=company,
                location=analysis.location,
                employment_type=analysis.employment_type,
                salary_min=analysis.salary_min,
                salary_max=analysis.salary_max,
                raw_description=data.raw_text,
                summary=analysis.summary,
                source_type="pasted"
            )
            db.add(job)
            db.commit()
            db.refresh(job)

            req = JobRequirement(
                job_id=job.id,
                required_skills=analysis.required_skills,
                preferred_skills=analysis.preferred_skills,
                required_experience_years=analysis.required_experience_years,
                education_requirements=analysis.education_requirements,
                responsibilities=analysis.responsibilities,
                keywords=analysis.keywords
            )
            db.add(req)
            db.commit()
            db.refresh(job)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"job_id": job.id, "title": job.title, "company": job.company}
            )
            return job

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            raise

    @classmethod
    async def create_from_url(
        cls,
        db: Session,
        url: str,
        user_id: Optional[str] = None
    ) -> Job:
        # Check duplicate by URL first
        dup = cls.check_duplicate(db, "", "", url=url)
        if dup:
            return dup

        activity = ActivityService.start_activity(
            db=db,
            agent_name="JobAgent",
            action="import_job_from_url",
            user_id=user_id,
            metadata={"url": url}
        )

        try:
            raw_text = await JobAgent.fetch_url_content(url)
            analysis = await JobAgent.analyze_job_text(raw_text)

            dup_title = cls.check_duplicate(db, analysis.title, analysis.company)
            if dup_title:
                ActivityService.complete_activity(
                    db=db, activity_id=activity.id, status="completed",
                    metadata={"duplicate": True, "job_id": dup_title.id}
                )
                return dup_title

            job = Job(
                title=analysis.title,
                company=analysis.company,
                location=analysis.location,
                employment_type=analysis.employment_type,
                salary_min=analysis.salary_min,
                salary_max=analysis.salary_max,
                raw_description=raw_text,
                summary=analysis.summary,
                source_type="url",
                source_url=url
            )
            db.add(job)
            db.commit()
            db.refresh(job)

            req = JobRequirement(
                job_id=job.id,
                required_skills=analysis.required_skills,
                preferred_skills=analysis.preferred_skills,
                required_experience_years=analysis.required_experience_years,
                education_requirements=analysis.education_requirements,
                responsibilities=analysis.responsibilities,
                keywords=analysis.keywords
            )
            db.add(req)
            db.commit()
            db.refresh(job)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"job_id": job.id, "title": job.title, "company": job.company}
            )
            return job

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            raise

    @classmethod
    def create_manual(
        cls,
        db: Session,
        data: JobCreateManual,
        user_id: Optional[str] = None
    ) -> Job:
        dup = cls.check_duplicate(db, data.title, data.company)
        if dup:
            return dup

        job = Job(
            title=data.title,
            company=data.company,
            location=data.location,
            employment_type=data.employment_type,
            raw_description=data.raw_description,
            summary=f"{data.title} role at {data.company}",
            source_type="manual"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        req = JobRequirement(
            job_id=job.id,
            required_skills=data.required_skills,
            preferred_skills=data.preferred_skills,
            required_experience_years=data.required_experience_years,
            education_requirements=["Bachelor's degree or equivalent experience"],
            responsibilities=data.responsibilities,
            keywords=data.required_skills + data.preferred_skills
        )
        db.add(req)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[Job]:
        return db.query(Job).filter(Job.id == job_id).first()

    @staticmethod
    def list_jobs(
        db: Session,
        search: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Job]:
        query = db.query(Job).filter(Job.is_active == True)
        if search:
            s = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(Job.title).like(s)) |
                (func.lower(Job.company).like(s))
            )
        if location and location != "All":
            query = query.filter(func.lower(Job.location).like(f"%{location.lower()}%"))

        return query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()

    @classmethod
    def seed_sample_jobs(cls, db: Session) -> List[Job]:
        """Seed realistic, rich job postings if database is empty."""
        sample_jobs = [
            {
                "title": "Senior Backend Engineer",
                "company": "Stripe",
                "location": "Remote (US)",
                "employment_type": "Full-time",
                "salary_min": 165000,
                "salary_max": 210000,
                "raw_description": (
                    "Stripe is looking for a Senior Backend Engineer to join our Core Infrastructure team. "
                    "You will design, build, and maintain high-availability APIs handling billions of dollars in daily volume. "
                    "Requirements: 5+ years experience with Python, FastAPI, distributed systems, and PostgreSQL. "
                    "Preferred: Experience with Kafka, Redis, Docker, and Kubernetes. Strong knowledge of transaction isolation and reliability."
                ),
                "required_skills": ["Python", "FastAPI", "PostgreSQL", "Distributed Systems", "REST API"],
                "preferred_skills": ["Kafka", "Redis", "Docker", "Kubernetes"],
                "required_experience_years": 5.0,
                "responsibilities": [
                    "Architect high-throughput, low-latency financial payment APIs.",
                    "Optimize database read/write queries and cache strategies for 99.999% reliability.",
                    "Lead architectural reviews and mentor junior engineering staff."
                ],
                "keywords": ["Fintech", "High Scale", "Distributed Systems", "Payments", "Python"]
            },
            {
                "title": "Distributed Systems Engineer",
                "company": "Datadog",
                "location": "New York, NY (Hybrid)",
                "employment_type": "Full-time",
                "salary_min": 170000,
                "salary_max": 225000,
                "raw_description": (
                    "Datadog is searching for an experienced Systems Engineer to build real-time observability telemetry pipelines. "
                    "You will work on streaming ingestion processing millions of metrics per second. "
                    "Requirements: Deep knowledge of Python, Go, Kafka, Docker, and Linux performance tuning. "
                    "Preferred: Kubernetes, AWS, Prometheus, System Architecture."
                ),
                "required_skills": ["Python", "Docker", "Kafka", "Linux", "System Design"],
                "preferred_skills": ["Kubernetes", "AWS", "Go", "Observability"],
                "required_experience_years": 4.0,
                "responsibilities": [
                    "Design high-throughput ingestion clusters handling real-time stream aggregation.",
                    "Diagnose kernel-level networking and memory bottlenecks in production.",
                    "Collaborate across global reliability engineering squads."
                ],
                "keywords": ["Observability", "Telemetry", "Kafka", "Linux", "Scale"]
            },
            {
                "title": "Full Stack Engineer",
                "company": "Linear",
                "location": "Remote",
                "employment_type": "Full-time",
                "salary_min": 150000,
                "salary_max": 195000,
                "raw_description": (
                    "Linear is building modern project management software that software teams love. "
                    "We value craft, speed, and pixel-level polish. "
                    "Requirements: TypeScript, React, Next.js, Node.js or Python backend, and PostgreSQL. "
                    "Preferred: Tailwind CSS, WebSockets, offline sync algorithms, GraphQL."
                ),
                "required_skills": ["TypeScript", "React", "Next.js", "PostgreSQL", "Tailwind CSS"],
                "preferred_skills": ["Python", "FastAPI", "WebSockets", "GraphQL"],
                "required_experience_years": 3.0,
                "responsibilities": [
                    "Build responsive, keyboard-first web UI workflows with sub-50ms interaction latency.",
                    "Develop robust backend endpoints with relational schema migrations.",
                    "Refine design system tokens and accessible component behaviors."
                ],
                "keywords": ["Product Engineering", "Frontend", "Full Stack", "TypeScript", "Linear"]
            },
            {
                "title": "Staff Platform Engineer",
                "company": "Airbnb",
                "location": "San Francisco, CA (Remote Friendly)",
                "employment_type": "Full-time",
                "salary_min": 190000,
                "salary_max": 260000,
                "raw_description": (
                    "Airbnb's Core Infrastructure team provides developer platforms and container orchestration for thousands of engineers. "
                    "Requirements: 7+ years in software engineering with heavy focus on Kubernetes, AWS, Terraform, Docker, Python, and CI/CD pipelines. "
                    "Preferred: Go, Service Mesh (Istio), large-scale cloud cost governance."
                ),
                "required_skills": ["Kubernetes", "AWS", "Docker", "Python", "CI/CD"],
                "preferred_skills": ["Terraform", "Go", "System Design", "Microservices"],
                "required_experience_years": 7.0,
                "responsibilities": [
                    "Scale multi-region Kubernetes clusters across AWS and multi-cloud accounts.",
                    "Standardize CI/CD deployment workflows and canary rollout automation.",
                    "Define reliability SLOs and incident management runbooks."
                ],
                "keywords": ["Platform", "DevOps", "Kubernetes", "AWS", "Infrastructure"]
            }
        ]

        created = []
        for item in sample_jobs:
            existing = cls.check_duplicate(db, item["title"], item["company"])
            if not existing:
                job = Job(
                    title=item["title"],
                    company=item["company"],
                    location=item["location"],
                    employment_type=item["employment_type"],
                    salary_min=item["salary_min"],
                    salary_max=item["salary_max"],
                    raw_description=item["raw_description"],
                    summary=f"Join {item['company']} as {item['title']}",
                    source_type="seeded"
                )
                db.add(job)
                db.commit()
                db.refresh(job)

                req = JobRequirement(
                    job_id=job.id,
                    required_skills=item["required_skills"],
                    preferred_skills=item["preferred_skills"],
                    required_experience_years=item["required_experience_years"],
                    education_requirements=["Bachelor's degree or equivalent practical experience"],
                    responsibilities=item["responsibilities"],
                    keywords=item["keywords"]
                )
                db.add(req)
                db.commit()
                db.refresh(job)
                created.append(job)
            else:
                created.append(existing)

        return created
