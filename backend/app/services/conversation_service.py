from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_db
from app.models.conversation import Conversation, ConversationStatus
from app.schemas.conversation import ConversationUpdate


async def get_or_create_conversation(
    contact_id: str,
    channel_id: str,
    channel_type: str = "whatsapp",
) -> Conversation:
    db = get_db()
    doc = await db.conversations.find_one({
        "contact_id": contact_id,
        "channel_id": channel_id,
        "status": {"$ne": ConversationStatus.CLOSED},
    })
    if doc:
        doc["_id"] = str(doc["_id"])
        return Conversation(**doc)

    conv = Conversation(
        contact_id=contact_id,
        channel_id=channel_id,
        channel_type=channel_type,
    )
    data = conv.model_dump(by_alias=True, exclude={"id"})
    result = await db.conversations.insert_one(data)
    conv.id = str(result.inserted_id)
    return conv


async def get_conversation(conv_id: str) -> Conversation:
    db = get_db()
    doc = await db.conversations.find_one({"_id": ObjectId(conv_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    doc["_id"] = str(doc["_id"])
    return Conversation(**doc)


async def list_conversations(
    status: ConversationStatus | None = None,
    assigned_to: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Conversation]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to

    conversations = []
    async for doc in (
        db.conversations.find(query)
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    ):
        doc["_id"] = str(doc["_id"])
        conversations.append(Conversation(**doc))
    return conversations


async def update_conversation(conv_id: str, data: ConversationUpdate) -> Conversation:
    db = get_db()
    update_data = data.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow()
    await db.conversations.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": update_data}
    )
    return await get_conversation(conv_id)


async def mark_conversation_read(conv_id: str):
    db = get_db()
    await db.conversations.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {"unread_count": 0, "updated_at": datetime.utcnow()}}
    )


async def update_last_message(conv_id: str, text: str | None, at: datetime):
    db = get_db()
    await db.conversations.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {
            "last_message_text": text or "(media)",
            "last_message_at": at,
            "updated_at": at,
        }, "$inc": {"unread_count": 1}}
    )
