import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password, create_access_token
from datetime import timedelta

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module", autouse=True)
def cleanup_auth_test_users():
    with SessionLocal() as db:
        db.query(User).filter(User.email.in_(["testcandidate@example.com", "inactive@example.com"])).delete(synchronize_session=False)
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(User).filter(User.email.in_(["testcandidate@example.com", "inactive@example.com"])).delete(synchronize_session=False)
        db.commit()

def test_register_success(client):

    res = client.post("/api/v1/auth/register", json={
        "email": "testcandidate@example.com",
        "full_name": "Test Candidate",
        "password": "Password123!"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testcandidate@example.com"
    assert data["user"]["full_name"] == "Test Candidate"
    assert data["user"]["role"] == "user"
    assert data["user"]["is_active"] is True
    assert "password_hash" not in data["user"]

def test_register_duplicate_email(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "testcandidate@example.com",
        "full_name": "Duplicate Candidate",
        "password": "Password123!"
    })
    assert res.status_code == 400
    assert "sudah terdaftar" in res.json()["detail"].lower()

def test_register_invalid_email(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "invalid-email-format",
        "full_name": "Invalid Candidate",
        "password": "Password123!"
    })
    assert res.status_code == 422

def test_register_short_password(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "shortpass@example.com",
        "full_name": "Short Pass",
        "password": "short"
    })
    assert res.status_code == 422

def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "testcandidate@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testcandidate@example.com"

def test_login_wrong_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "testcandidate@example.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401

def test_login_unknown_email(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 401

def test_auth_me_endpoints(client):
    # 1. Login to get token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testcandidate@example.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    # 2. Access /auth/me with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert me_res.status_code == 200
    user_info = me_res.json()
    assert user_info["email"] == "testcandidate@example.com"
    assert user_info["role"] == "user"

    # 3. Access without token should fail
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # 4. Access with invalid token should fail
    invalid_res = client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer invalid.token.payload"
    })
    assert invalid_res.status_code == 401

def test_logout(client):
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testcandidate@example.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    logout_res = client.post("/api/v1/auth/logout", headers={
        "Authorization": f"Bearer {token}"
    })
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"

def test_inactive_user_cannot_access(client, db: Session):
    # Create inactive user
    inactive_user = User(
        email="inactive@example.com",
        full_name="Inactive User",
        password_hash=hash_password("Password123!"),
        role="user",
        is_active=False
    )
    db.add(inactive_user)
    db.commit()

    # Login attempt fails with 403
    login_res = client.post("/api/v1/auth/login", json={
        "email": "inactive@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 403

    # Token attempt fails with 403
    token = create_access_token({"sub": inactive_user.id})
    me_res = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert me_res.status_code == 403
