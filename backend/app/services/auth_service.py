from datetime import timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse

class AuthService:
    @staticmethod
    def register_user(db: Session, request: UserRegisterRequest) -> User:
        """Register a new user with role='user'. Prevents privilege escalation."""
        clean_email = request.email.strip().lower()
        existing_user = db.query(User).filter(User.email == clean_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."
            )

        hashed = hash_password(request.password)
        new_user = User(
            email=clean_email,
            full_name=request.full_name.strip(),
            password_hash=hashed,
            role="user",  # Strict enforcement: public registration is always 'user'
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Authenticate user credentials and return the active User."""
        clean_email = email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()
        
        # Generic error message to prevent user enumeration
        auth_error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password tidak sesuai. Periksa kembali data Anda.",
            headers={"WWW-Authenticate": "Bearer"}
        )

        if not user or not user.password_hash:
            raise auth_error

        if not verify_password(password, user.password_hash):
            raise auth_error

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akun pengguna telah dinonaktifkan. Hubungi administrator."
            )

        return user

    @staticmethod
    def create_user_token(user: User) -> TokenResponse:
        """Create JWT bearer token for the user."""
        token_data = {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role,
        }
        token = create_access_token(data=token_data)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    def seed_initial_admin(
        db: Session,
        admin_email: Optional[str] = None,
        admin_password: Optional[str] = None,
        admin_name: str = "JobHunter Administrator"
    ) -> Optional[User]:
        """Idempotently ensure at least one active administrator account exists."""
        clean_email = (admin_email or settings.INITIAL_ADMIN_EMAIL).strip().lower()
        pwd = admin_password or settings.INITIAL_ADMIN_PASSWORD
        existing = db.query(User).filter(User.email == clean_email).first()
        if existing:
            # Ensure it is admin
            if existing.role != "admin" or not existing.is_active or not existing.password_hash:
                existing.role = "admin"
                existing.is_active = True
                if not existing.password_hash:
                    existing.password_hash = hash_password(pwd)
                db.commit()
                db.refresh(existing)
            return existing

        admin = User(
            email=clean_email,
            full_name=admin_name,
            password_hash=hash_password(pwd),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin

    @staticmethod
    def seed_initial_candidate(
        db: Session,
        candidate_email: str = "candidate@jobhunter.ai",
        candidate_password: str = "CandidateJobHunter2026!",
        candidate_name: str = "Alex Mercer"
    ) -> Optional[User]:
        """Idempotently ensure default demo candidate account exists and has a valid password."""
        clean_email = candidate_email.strip().lower()
        existing = db.query(User).filter(User.email == clean_email).first()
        if existing:
            needs_commit = False
            if not existing.password_hash:
                existing.password_hash = hash_password(candidate_password)
                needs_commit = True
            if not existing.is_active:
                existing.is_active = True
                needs_commit = True
            if needs_commit:
                db.commit()
                db.refresh(existing)
            return existing

        candidate = User(
            email=clean_email,
            full_name=candidate_name,
            password_hash=hash_password(candidate_password),
            role="user",
            is_active=True
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return candidate

    @classmethod
    def seed_initial_users(cls, db: Session):
        """Seed both initial admin and demo candidate accounts."""
        cls.seed_initial_admin(db)
        cls.seed_initial_candidate(db)

