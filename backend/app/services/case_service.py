from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from app.database import get_db
from app.models.case import Case, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate


async def get_or_create_case(conversation_id: str, contact_id: str) -> Case:
    db = get_db()
    doc = await db.cases.find_one({
        "conversation_id": conversation_id,
        "status": {"$nin": [CaseStatus.CLOSED, CaseStatus.RESOLVED]},
    })
    if doc:
        doc["_id"] = str(doc["_id"])
        return Case(**doc)

    case = Case(conversation_id=conversation_id, contact_id=contact_id)
    data = case.model_dump(by_alias=True, exclude={"id"})
    result = await db.cases.insert_one(data)
    case.id = str(result.inserted_id)
    return case


async def get_case_by_conversation(conversation_id: str) -> Case | None:
    db = get_db()
    doc = await db.cases.find_one({"conversation_id": conversation_id})
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return Case(**doc)


async def get_case(case_id: str) -> Case:
    db = get_db()
    doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Case not found")
    doc["_id"] = str(doc["_id"])
    return Case(**doc)


async def update_case(case_id: str, data: CaseUpdate) -> Case:
    db = get_db()
    update_data = data.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow()
    if data.status in (CaseStatus.RESOLVED, CaseStatus.CLOSED):
        update_data["resolved_at"] = datetime.utcnow()
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_data}
    )
    return await get_case(case_id)


async def list_cases(
    status: CaseStatus | None = None,
    assigned_to: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Case]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to

    cases = []
    async for doc in (
        db.cases.find(query)
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    ):
        doc["_id"] = str(doc["_id"])
        cases.append(Case(**doc))
    return cases
