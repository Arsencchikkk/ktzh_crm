from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.models.conversation import ConversationStatus
from app.schemas.conversation import ConversationResponse, ConversationUpdate
from app.schemas.contact import ContactResponse
from app.schemas.auth import UserResponse
from app.services import conversation_service, contact_service, auth_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


async def _enrich_conversation(conv, db) -> ConversationResponse:
    """Add contact and operator data to conversation response."""
    contact = None
    try:
        c = await contact_service.get_contact(conv.contact_id)
        contact = ContactResponse(
            id=str(c.id), phone=c.phone, name=c.name,
            email=c.email, notes=c.notes,
            created_at=c.created_at, updated_at=c.updated_at,
        )
    except Exception:
        pass

    operator_name = None
    if conv.assigned_to:
        ops = await auth_service.list_operators()
        for op in ops:
            if op["_id"] == conv.assigned_to:
                operator_name = op["full_name"]
                break

    return ConversationResponse(
        id=str(conv.id),
        contact_id=conv.contact_id,
        contact=contact,
        channel_id=conv.channel_id,
        channel_type=conv.channel_type,
        status=conv.status,
        last_message_text=conv.last_message_text,
        last_message_at=conv.last_message_at,
        unread_count=conv.unread_count,
        assigned_to=conv.assigned_to,
        assigned_operator_name=operator_name,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.get("/", response_model=list[ConversationResponse])
async def list_conversations(
    status: ConversationStatus | None = None,
    assigned_to: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
):
    db = get_db()
    convs = await conversation_service.list_conversations(
        status=status, assigned_to=assigned_to, skip=skip, limit=limit
    )
    result = []
    for conv in convs:
        result.append(await _enrich_conversation(conv, db))
    return result


@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_active_user),
):
    db = get_db()
    conv = await conversation_service.get_conversation(conv_id)
    await conversation_service.mark_conversation_read(conv_id)
    return await _enrich_conversation(conv, db)


@router.patch("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: str,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
):
    db = get_db()
    conv = await conversation_service.update_conversation(conv_id, data)
    from app.websocket.manager import ws_manager
    from app.websocket.events import CONVERSATION_UPDATED
    await ws_manager.broadcast({
        "type": CONVERSATION_UPDATED,
        "data": {"id": conv_id, "status": conv.status, "assigned_to": conv.assigned_to},
    })
    return await _enrich_conversation(conv, db)
