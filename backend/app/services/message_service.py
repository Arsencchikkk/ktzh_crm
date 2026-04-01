from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_db
from app.models.message import Message, MessageDirection, MessageStatus


async def create_message(
    conversation_id: str,
    contact_id: str,
    direction: MessageDirection,
    text: str | None = None,
    media_url: str | None = None,
    media_type: str | None = None,
    wazzup_message_id: str | None = None,
    sent_by: str | None = None,
) -> Message:
    db = get_db()
    msg = Message(
        conversation_id=conversation_id,
        contact_id=contact_id,
        direction=direction,
        text=text,
        media_url=media_url,
        media_type=media_type,
        wazzup_message_id=wazzup_message_id,
        sent_by=sent_by,
    )
    data = msg.model_dump(by_alias=True, exclude={"id"})
    result = await db.messages.insert_one(data)
    msg.id = str(result.inserted_id)
    return msg


async def list_messages(conversation_id: str, skip: int = 0, limit: int = 100) -> list[Message]:
    db = get_db()
    messages = []
    async for doc in (
        db.messages.find({"conversation_id": conversation_id})
        .sort("created_at", 1)
        .skip(skip)
        .limit(limit)
    ):
        doc["_id"] = str(doc["_id"])
        messages.append(Message(**doc))
    return messages


async def update_message_status(message_id: str, status: MessageStatus):
    db = get_db()
    await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"status": status}}
    )
