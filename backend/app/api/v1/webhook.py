import logging
from fastapi import APIRouter, Request, HTTPException

from app.services import contact_service, conversation_service, message_service
from app.models.message import MessageDirection
from app.websocket.manager import ws_manager
from app.websocket.events import NEW_MESSAGE, CONVERSATION_UPDATED
from app.schemas.message import MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/wazzup")
async def wazzup_webhook(request: Request):
    """
    Receives incoming messages from Wazzup.
    Wazzup sends a POST with JSON body containing messages array.

    Wazzup webhook payload example:
    {
      "messages": [
        {
          "messageId": "abc123",
          "channelId": "ch_123",
          "chatType": "whatsapp",
          "chatId": "77001234567",      // phone number
          "text": "Здравствуйте!",
          "timestamp": 1700000000,
          "type": "text",
          "from_me": false,
          "contact": {
            "name": "Асхат Сейткали"
          }
        }
      ]
    }
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    messages = body.get("messages", [])
    if not messages:
        return {"status": "ok", "processed": 0}

    processed = 0
    for msg_data in messages:
        try:
            await _process_incoming_message(msg_data)
            processed += 1
        except Exception as e:
            logger.error(f"Failed to process message: {e}", exc_info=True)

    return {"status": "ok", "processed": processed}


async def _process_incoming_message(msg_data: dict):
    # Skip messages sent by us
    if msg_data.get("from_me", False):
        return

    channel_id = msg_data.get("channelId", "")
    phone = msg_data.get("chatId", "")
    text = msg_data.get("text")
    wazzup_message_id = msg_data.get("messageId")
    contact_name = msg_data.get("contact", {}).get("name")
    chat_type = msg_data.get("chatType", "whatsapp")

    if not phone:
        logger.warning("Received message without chatId, skipping")
        return

    # Normalize phone (remove + prefix for DB consistency)
    phone = phone.strip().lstrip("+")

    # 1. Get or create contact
    contact = await contact_service.get_or_create_contact(phone=phone, name=contact_name)

    # 2. Get or create conversation
    conv = await conversation_service.get_or_create_conversation(
        contact_id=str(contact.id),
        channel_id=channel_id,
        channel_type=chat_type,
    )

    # 3. Save message
    import re
    from datetime import datetime
    msg = await message_service.create_message(
        conversation_id=str(conv.id),
        contact_id=str(contact.id),
        direction=MessageDirection.INBOUND,
        text=text,
        wazzup_message_id=wazzup_message_id,
    )

    # 4. Update conversation
    await conversation_service.update_last_message(str(conv.id), text, msg.created_at)

    # 5. Broadcast via WebSocket to all operators
    msg_payload = MessageResponse(
        id=str(msg.id),
        conversation_id=str(conv.id),
        contact_id=str(contact.id),
        direction=msg.direction,
        text=msg.text,
        media_url=msg.media_url,
        media_type=msg.media_type,
        status=msg.status,
        wazzup_message_id=msg.wazzup_message_id,
        sent_by=msg.sent_by,
        created_at=msg.created_at,
    )

    await ws_manager.broadcast({
        "type": NEW_MESSAGE,
        "data": msg_payload.model_dump(),
        "conversation_id": str(conv.id),
        "contact": {
            "id": str(contact.id),
            "phone": contact.phone,
            "name": contact.name,
        },
    })

    logger.info(f"Processed inbound message: conv={conv.id}, phone={phone}")
