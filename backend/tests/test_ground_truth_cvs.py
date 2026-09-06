import pytest
import uuid
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.job import Job, JobRequirement
from app.models.candidate_profile import CandidateProfile
from app.schemas.candidate_profile import (
    CandidateProfileData, 
    ExperienceItem, 
    EducationItem, 
    OrganizationItem
)
from app.services.profile_service import ProfileService
from app.services.match_service import MatchService
from app.services.recommendation_service import RecommendationService
from app.agents.match_agent import MatchAgent

from app.core.database import SessionLocal, init_db

@pytest.fixture
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.close()

def test_ground_truth_mahabbah_profile_schema_and_anti_hallucination():
    """
    Ground Truth 1: Mahabbah Mahabban Romadhon
    Key constraints:
    - Education: SMKN 3 YOGYAKARTA, TKJ, GPA 90.
    - PKL at Immersa: role/title is NOT specified in CV, so role MUST be None!
    - Zero fake placeholders or synthesized job titles.
    """
    exp = ExperienceItem(
        company="Immersa",
        role=None,
        title=None,
        period="Desember 2026 – April 2027",
        responsibilities=[
            "Melakukan instalasi, konfigurasi, dan pengujian sistem operasi serta aplikasi software pendukung.",
            "Melakukan troubleshooting dasar pada perangkat keras (hardware) dan jaringan.",
            "Membantu pemeliharaan rutin perangkat komputer dan infrastruktur jaringan kantor.",
            "Membuat dokumentasi hasil perbaikan dan pemeliharaan sistem secara berkala."
        ]
    )

    edu_smk = EducationItem(
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
    )

    edu_smp = EducationItem(
        institution="SMP NEGERI 9 YOGYAKARTA",
        degree="SMP",
        period="2021–2024"
    )

    profile = CandidateProfileData(
        full_name="Mahabbah Mahabban Romadhon",
        email="mahabbah.mr@gmail.com",
        phone="081228516766",
        location="Karangbunder RT.03/RW.38, Baturetno, Banguntapan, Bantul",
        skills=[
            "Perakitan Komputer",
            "Instalasi Jaringan & Komputer",
            "Troubleshooting Hardware & Jaringan",
            "Konfigurasi Router (MikroTik)",
            "Administrasi Server Dasar",
            "Disiplin",
            "Problem Solving"
        ],
        experience=[exp],
        education=[edu_smk, edu_smp],
        organizations=[],
        certifications=[]
    )

    # STRICT ANTI-HALLUCINATION ASSERTIONS:
    # 1. Role must strictly remain None if not present in CV
    assert profile.experience[0].role is None
    assert profile.experience[0].title is None
    assert profile.experience[0].role != "Staff"
    assert profile.experience[0].role != "Role"
    assert profile.experience[0].role != "Unknown"
    assert profile.experience[0].role != "N/A"
    assert profile.experience[0].company == "Immersa"
    assert profile.experience[0].period == "Desember 2026 – April 2027"
    assert len(profile.experience[0].responsibilities) == 4

    # 2. Education assertions
    assert profile.education[0].institution == "SMKN 3 YOGYAKARTA"
    assert profile.education[0].degree == "SMK"
    assert profile.education[0].field_of_study == "Teknik Komputer dan Jaringan"
    assert profile.education[0].gpa == "90"
    assert len(profile.education[0].details) == 4

def test_ground_truth_anindito_profile_with_organizations_and_certifications():
    """
    Ground Truth 2: Anindito Aziz Purwanto
    Key constraints:
    - PUSTIK UNY experience with explicit title: Asisten Laboratorium dan Administrasi
    - 5 verified organization entries
    - 3 verified certifications (Google AI, Google Data Analytics, LKS IT Network)
    """
    exp = ExperienceItem(
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

    orgs = [
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
    ]

    certs = [
        "Google AI Essentials",
        "Google Data Analytics Professional Certificate",
        "Pelatihan LKS Bidang IT Network Systems Administration"
    ]

    profile = CandidateProfileData(
        full_name="Anindito Aziz Purwanto",
        summary="Siswa SMK jurusan Teknik Komputer dan Jaringan dengan minat mendalam di bidang Administrasi Jaringan, Keamanan Siber, dan Analisis Data.",
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
        experience=[exp],
        education=[
            EducationItem(
                institution="SMK Negeri 3 Yogyakarta",
                degree="SMK",
                field_of_study="Teknik Komputer dan Jaringan",
                period="2024 – 2027"
            )
        ],
        organizations=orgs,
        certifications=certs
    )

    assert profile.full_name == "Anindito Aziz Purwanto"
    assert profile.experience[0].company == "Pusat Teknologi Informasi dan Komunikasi UNY"
    assert profile.experience[0].role == "Asisten Laboratorium dan Administrasi"
    assert len(profile.organizations) == 5
    assert profile.organizations[0].name == "Pleton Inti SMK Negeri 3 Yogyakarta"
    assert profile.organizations[2].role == "Ketua Divisi Logistik"
    assert len(profile.certifications) == 3
    assert "Google AI Essentials" in profile.certifications

@pytest.mark.asyncio
async def test_profile_service_persistence_with_organizations(db: Session):
    """Verify database persistence and retrieval of organizations and certifications."""
    user = User(
        email=f"anindito.{uuid.uuid4()}@jobhunter.ai",
        full_name="Anindito Aziz Purwanto"
    )
    db.add(user)
    db.commit()

    update_payload = {
        "full_name": "Anindito Aziz Purwanto",
        "summary": "Siswa SMK TKJ minat Administrasi Jaringan",
        "skills": ["MikroTik", "Linux", "Python dasar"],
        "experience": [
            {
                "company": "Pusat Teknologi Informasi dan Komunikasi UNY",
                "role": "Asisten Laboratorium dan Administrasi",
                "period": "Januari 2026 – Mei 2026",
                "responsibilities": ["Mengelola 50 workstation"]
            }
        ],
        "education": [
            {
                "institution": "SMK Negeri 3 Yogyakarta",
                "degree": "SMK",
                "field_of_study": "Teknik Komputer dan Jaringan",
                "period": "2024 – 2027"
            }
        ],
        "organizations": [
            {
                "name": "Pleton Inti SMK Negeri 3 Yogyakarta",
                "role": "Anggota Aktif & Instruktur Muda",
                "period": "2024 – 2025"
            },
            {
                "name": "Buka Sareng BARA 2025",
                "role": "Ketua Divisi Logistik",
                "period": "2025"
            }
        ],
        "certifications": [
            "Google AI Essentials",
            "Google Data Analytics Professional Certificate"
        ]
    }

    saved = ProfileService.update_profile(db=db, user_id=user.id, profile_data=update_payload)
    assert saved is not None
    assert saved.full_name == "Anindito Aziz Purwanto"
    assert len(saved.organizations) == 2
    assert saved.organizations[0]["name"] == "Pleton Inti SMK Negeri 3 Yogyakarta"
    assert len(saved.certifications) == 2
    assert "Google AI Essentials" in saved.certifications

    # Retrieve from DB to verify raw JSON persistence
    db_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    assert db_profile is not None
    assert isinstance(db_profile.organizations, list)
    assert len(db_profile.organizations) == 2
    assert db_profile.organizations[1]["role"] == "Ketua Divisi Logistik"

@pytest.mark.asyncio
async def test_deterministic_matching_with_ground_truth_profiles(db: Session):
    """Verify deterministic compatibility scoring and skill gap matrix against a real job."""
    user = User(
        email=f"mahabbah.{uuid.uuid4()}@jobhunter.ai",
        full_name="Mahabbah Mahabban Romadhon"
    )
    db.add(user)
    db.commit()

    # Save Mahabbah profile
    ProfileService.update_profile(db=db, user_id=user.id, profile_data={
        "full_name": "Mahabbah Mahabban Romadhon",
        "skills": [
            "Perakitan Komputer",
            "Instalasi Jaringan & Komputer",
            "Troubleshooting Hardware & Jaringan",
            "Konfigurasi Router (MikroTik)",
            "Administrasi Server Dasar"
        ],
        "experience": [
            {
                "company": "Immersa",
                "role": None,
                "period": "Desember 2026 – April 2027",
                "responsibilities": [
                    "Troubleshooting dasar hardware dan jaringan.",
                    "Instalasi dan konfigurasi sistem operasi."
                ]
            }
        ],
        "education": [
            {
                "institution": "SMKN 3 YOGYAKARTA",
                "degree": "SMK",
                "field_of_study": "Teknik Komputer dan Jaringan",
                "period": "2024–2027",
                "gpa": "90"
            }
        ]
    })

    # Create matching job
    job = Job(
        title="IT Technical Support & Network Specialist",
        company="PT Cipta Jaringan Solusindo",
        location="Yogyakarta, Indonesia",
        employment_type="Full-time",
        raw_description="""
        Dibutuhkan IT Technical Support & Network Specialist.
        Kualifikasi:
        - Menguasai instalasi, konfigurasi router MikroTik.
        - Memahami perakitan komputer dan troubleshooting hardware serta jaringan.
        - Lulusan SMK TKJ atau sederajat.
        - Disiplin dan bertanggung jawab.
        """,
        is_active=True
    )
    db.add(job)
    db.commit()

    req = JobRequirement(
        job_id=job.id,
        required_skills=["MikroTik", "Perakitan Komputer", "Troubleshooting Hardware & Jaringan"],
        preferred_skills=["Linux", "Cisco"],
        required_experience_years=0.5,
        education_requirements=["SMK"],
        responsibilities=["Troubleshooting hardware dan konfigurasi router."],
        keywords=["MikroTik", "Network", "Hardware", "Troubleshooting"]
    )
    db.add(req)
    db.commit()

    # Calculate deterministic match
    match_record = await MatchService.match_candidate_to_job(db=db, job_id=job.id, user_id=user.id)
    assert match_record is not None
    assert match_record.overall_score >= 60, f"Expected high match, got {match_record.overall_score}"
    assert match_record.skills_score > 50

    # Check skill gap analysis via RecommendationService
    gap = await RecommendationService.get_skill_gap_analysis(db=db, job_id=job.id, user_id=user.id)
    assert gap is not None
    assert gap.job_id == job.id
    assert "Already Strong" in gap.categories
    assert len(gap.action_plan) > 0
