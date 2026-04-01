import certifi

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=certifi.where())
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.MONGODB_DB]


async def close_db():
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def init_db():
    """Create indexes on startup."""
    db = get_db()
    # Users
    await db.users.create_index("email", unique=True)
    # Contacts
    await db.contacts.create_index("phone", unique=True)
    # Conversations
    await db.conversations.create_index("contact_id")
    await db.conversations.create_index("channel_id")
    await db.conversations.create_index([("updated_at", -1)])
    # Messages
    await db.messages.create_index("conversation_id")
    await db.messages.create_index([("created_at", 1)])
    await db.messages.create_index("wazzup_message_id", sparse=True)
    # Cases
    await db.cases.create_index("conversation_id")
    await db.cases.create_index("assigned_to")
    await db.cases.create_index("status")
