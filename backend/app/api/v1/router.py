from fastapi import APIRouter
from app.api.v1 import auth, contacts, conversations, messages, cases, webhook

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(contacts.router)
router.include_router(conversations.router)
router.include_router(messages.router)
router.include_router(cases.router)
router.include_router(webhook.router)
