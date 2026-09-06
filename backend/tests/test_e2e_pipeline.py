import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_autonomous_pipeline_e2e():
    """
    Complete end-to-end workflow verification:
    1. Seed jobs
    2. Check profile extraction
    3. Run autonomous pipeline for a job
    4. Verify match, skill gap, tailored resume, cover letter, and application tracker
    5. Verify AI dashboard stats and evaluation metrics
    """
    # 1. Seed jobs
    seed_res = client.post("/api/v1/jobs/seed")
    assert seed_res.status_code == 200
    jobs = seed_res.json()
    assert len(jobs) >= 4
    job_id = jobs[0]["id"]

    # 2. Get profile (mock/seeded)
    profile_res = client.get("/api/v1/candidate/profile")
    assert profile_res.status_code == 200

    # 3. Trigger 1-click autonomous pipeline
    pipeline_res = client.post(f"/api/v1/ai/pipeline/{job_id}")
    assert pipeline_res.status_code == 200
    p_data = pipeline_res.json()
    assert "match" in p_data
    assert "skill_gap" in p_data
    assert "tailored_resume" in p_data
    assert "cover_letter" in p_data
    assert "application" in p_data

    # Verify Match Score & Breakdown
    match = p_data["match"]
    assert 0 <= match["overall_score"] <= 100
    assert "breakdown" in match

    # Verify 4-category Skill Gap Matrix
    skill_gap = p_data["skill_gap"]
    assert "already_strong" in skill_gap
    assert "some_experience" in skill_gap
    assert "needs_improvement" in skill_gap
    assert "missing" in skill_gap

    # Verify Tailored Resume & Anti-Hallucination
    tailored_resume = p_data["tailored_resume"]
    assert tailored_resume["document_type"] == "tailored_resume"
    assert len(tailored_resume["content"]) > 100

    # Verify Cover Letter
    cover_letter = p_data["cover_letter"]
    assert cover_letter["document_type"] == "cover_letter"
    assert len(cover_letter["content"]) > 100

    # Verify Application Tracker Entry
    app_entry = p_data["application"]
    assert app_entry["status"] in ["Applied", "Wishlist"]
    assert app_entry["job_id"] == job_id

    # 4. Check Kanban board
    kanban_res = client.get("/api/v1/applications/kanban")
    assert kanban_res.status_code == 200
    kanban_data = kanban_res.json()
    applied_col = next((col for col in kanban_data if col["status"] == "Applied"), None)
    assert applied_col is not None
    apps = applied_col.get("applications") or applied_col.get("items") or []
    assert len(apps) >= 1

    # 5. Check Dashboard stats & Evaluation metrics
    stats_res = client.get("/api/v1/ai/dashboard-stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_jobs"] >= 4
    assert stats["active_applications"] >= 1

    eval_res = client.get("/api/v1/ai/evaluation")
    assert eval_res.status_code == 200
    evaluation = eval_res.json()
    assert evaluation["hallucination_rate"] == "0.0%"
    assert evaluation["total_agent_actions"] >= 1
