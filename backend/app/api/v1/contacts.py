from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.services import contact_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/", response_model=list[ContactResponse])
async def list_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
):
    contacts = await contact_service.list_contacts(skip=skip, limit=limit)
    return [
        ContactResponse(
            id=str(c.id),
            phone=c.phone,
            name=c.name,
            email=c.email,
            notes=c.notes,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in contacts
    ]


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: User = Depends(get_current_active_user),
):
    c = await contact_service.get_contact(contact_id)
    return ContactResponse(
        id=str(c.id),
        phone=c.phone,
        name=c.name,
        email=c.email,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    data: ContactUpdate,
    current_user: User = Depends(get_current_active_user),
):
    c = await contact_service.update_contact(contact_id, data)
    return ContactResponse(
        id=str(c.id),
        phone=c.phone,
        name=c.name,
        email=c.email,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )
