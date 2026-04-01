from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.message import MessageDirection
from app.schemas.message import MessageResponse, SendMessageRequest
from app.services import message_service, conversation_service, contact_service
from app.services import wazzup_service
from app.websocket.manager import ws_manager
from app.websocket.events import NEW_MESSAGE
from app.config import settings

router = APIRouter(prefix="/conversations/{conv_id}/messages", tags=["messages"])


@router.get("/", response_model=list[MessageResponse])
async def list_messages(
    conv_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    messages = await message_service.list_messages(conv_id, skip=skip, limit=limit)
    return [
        MessageResponse(
            id=str(m.id),
            conversation_id=m.conversation_id,
            contact_id=m.contact_id,
            direction=m.direction,
            text=m.text,
            media_url=m.media_url,
            media_type=m.media_type,
            status=m.status,
            wazzup_message_id=m.wazzup_message_id,
            sent_by=m.sent_by,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/", response_model=MessageResponse, status_code=201)
async def send_message(
    conv_id: str,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Operator sends a message → save to DB → send via Wazzup → WhatsApp."""
    conv = await conversation_service.get_conversation(conv_id)
    contact = await contact_service.get_contact(conv.contact_id)

    # Send through Wazzup
    try:
        wazzup_resp = await wazzup_service.send_message(
            phone=contact.phone,
            text=data.text,
            channel_id=conv.channel_id,
        )
        wazzup_message_id = wazzup_resp.get("messageId")
    except Exception as e:
        # Still save locally even if Wazzup fails (mark as failed)
        wazzup_message_id = None

    # Save to DB
    msg = await message_service.create_message(
        conversation_id=conv_id,
        contact_id=conv.contact_id,
        direction=MessageDirection.OUTBOUND,
        text=data.text,
        wazzup_message_id=wazzup_message_id,
        sent_by=str(current_user.id),
    )

    # Update conversation last message
    await conversation_service.update_last_message(conv_id, data.text, msg.created_at)

    msg_data = MessageResponse(
        id=str(msg.id),
        conversation_id=msg.conversation_id,
        contact_id=msg.contact_id,
        direction=msg.direction,
        text=msg.text,
        media_url=msg.media_url,
        media_type=msg.media_type,
        status=msg.status,
        wazzup_message_id=msg.wazzup_message_id,
        sent_by=msg.sent_by,
        created_at=msg.created_at,
    )

    # Broadcast via WebSocket
    await ws_manager.broadcast({
        "type": NEW_MESSAGE,
        "data": msg_data.model_dump(),
    })

    return msg_data
