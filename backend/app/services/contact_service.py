from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_db
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate


async def get_or_create_contact(phone: str, name: str | None = None) -> Contact:
    db = get_db()
    doc = await db.contacts.find_one({"phone": phone})
    if doc:
        doc["_id"] = str(doc["_id"])
        return Contact(**doc)

    contact = Contact(phone=phone, name=name)
    data = contact.model_dump(by_alias=True, exclude={"id"})
    result = await db.contacts.insert_one(data)
    contact.id = str(result.inserted_id)
    return contact


async def get_contact(contact_id: str) -> Contact:
    db = get_db()
    doc = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Contact not found")
    doc["_id"] = str(doc["_id"])
    return Contact(**doc)


async def update_contact(contact_id: str, data: ContactUpdate) -> Contact:
    db = get_db()
    update_data = data.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow()
    await db.contacts.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": update_data}
    )
    return await get_contact(contact_id)


async def list_contacts(skip: int = 0, limit: int = 50) -> list[Contact]:
    db = get_db()
    contacts = []
    async for doc in db.contacts.find().skip(skip).limit(limit):
        doc["_id"] = str(doc["_id"])
        contacts.append(Contact(**doc))
    return contacts
