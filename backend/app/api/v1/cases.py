from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.case import CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.services import case_service, auth_service
from app.websocket.manager import ws_manager
from app.websocket.events import CASE_UPDATED

router = APIRouter(prefix="/cases", tags=["cases"])


async def _enrich_case(case) -> CaseResponse:
    operator_name = None
    if case.assigned_to:
        ops = await auth_service.list_operators()
        for op in ops:
            if op["_id"] == case.assigned_to:
                operator_name = op["full_name"]
                break
    return CaseResponse(
        id=str(case.id),
        conversation_id=case.conversation_id,
        contact_id=case.contact_id,
        title=case.title,
        description=case.description,
        status=case.status,
        priority=case.priority,
        category=case.category,
        assigned_to=case.assigned_to,
        assigned_operator_name=operator_name,
        resolved_at=case.resolved_at,
        created_at=case.created_at,
        updated_at=case.updated_at,
    )


@router.get("/", response_model=list[CaseResponse])
async def list_cases(
    status: CaseStatus | None = None,
    assigned_to: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
):
    cases = await case_service.list_cases(status=status, assigned_to=assigned_to, skip=skip, limit=limit)
    result = []
    for case in cases:
        result.append(await _enrich_case(case))
    return result


@router.post("/conversation/{conv_id}", response_model=CaseResponse, status_code=201)
async def get_or_create_case_for_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get existing open case or create a new one for the conversation."""
    from app.services import conversation_service
    conv = await conversation_service.get_conversation(conv_id)
    case = await case_service.get_or_create_case(conv_id, conv.contact_id)
    return await _enrich_case(case)


@router.get("/conversation/{conv_id}", response_model=CaseResponse | None)
async def get_case_by_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_active_user),
):
    case = await case_service.get_case_by_conversation(conv_id)
    if not case:
        return None
    return await _enrich_case(case)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_active_user),
):
    case = await case_service.get_case(case_id)
    return await _enrich_case(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    data: CaseUpdate,
    current_user: User = Depends(get_current_active_user),
):
    case = await case_service.update_case(case_id, data)
    enriched = await _enrich_case(case)
    await ws_manager.broadcast({
        "type": CASE_UPDATED,
        "data": enriched.model_dump(),
    })
    return enriched
