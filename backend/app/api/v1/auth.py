from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, CreateUserRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    user = await auth_service.authenticate_user(data.email, data.password)
    token = auth_service.generate_token(user)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: CreateUserRequest):
    """Create a new operator account. In production, restrict to admin only."""
    user = await auth_service.create_operator(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        role=data.role,
    )
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.get("/operators", response_model=list[UserResponse])
async def list_operators(current_user: User = Depends(get_current_active_user)):
    operators = await auth_service.list_operators()
    return [
        UserResponse(
            id=op["_id"],
            email=op["email"],
            full_name=op["full_name"],
            role=op["role"],
            is_active=op["is_active"],
        )
        for op in operators
    ]
