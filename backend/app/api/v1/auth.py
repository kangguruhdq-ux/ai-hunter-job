from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Registers a new candidate user and returns a signed access token. Strict role enforcement ensures role='user'."
)
def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
) -> TokenResponse:
    user = AuthService.register_user(db, request)
    return AuthService.create_user_token(user)

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT token",
    description="Authenticates email and password. Returns access token, token type, and user profile information."
)
def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
) -> TokenResponse:
    user = AuthService.authenticate_user(db, request.email, request.password)
    return AuthService.create_user_token(user)

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Retrieves the current user's profile information using the Bearer access token."
)
def get_me(
    current_user: User = Depends(get_current_active_user)
) -> UserResponse:
    return UserResponse.model_validate(current_user)

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user session",
    description="Stateless logout confirmation. Instructs the client to remove stored credentials."
)
def logout(
    current_user: User = Depends(get_current_active_user)
) -> dict:
    return {
        "status": "success",
        "message": "Sesi berhasil diakhiri. Silakan login kembali untuk melanjutkan."
    }
