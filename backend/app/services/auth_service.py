from bson import ObjectId
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.database import get_db
from app.models.user import User, UserRole


async def authenticate_user(email: str, password: str) -> User:
    db = get_db()
    doc = await db.users.find_one({"email": email})
    if not doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    doc["_id"] = str(doc["_id"])
    user = User(**doc)
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


async def create_operator(email: str, password: str, full_name: str, role: UserRole = UserRole.OPERATOR) -> User:
    db = get_db()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=role,
    )
    doc = user.model_dump(by_alias=True, exclude={"id"})
    result = await db.users.insert_one(doc)
    user.id = str(result.inserted_id)
    return user


def generate_token(user: User) -> str:
    return create_access_token({"sub": str(user.id)})


async def list_operators() -> list[dict]:
    db = get_db()
    operators = []
    async for doc in db.users.find({"is_active": True}):
        doc["_id"] = str(doc["_id"])
        operators.append(doc)
    return operators
