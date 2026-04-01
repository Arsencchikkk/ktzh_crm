from app.services.auth_service import authenticate_user, create_operator, generate_token, list_operators
from app.services.contact_service import get_or_create_contact, get_contact, update_contact, list_contacts
from app.services.conversation_service import (
    get_or_create_conversation, get_conversation, list_conversations,
    update_conversation, mark_conversation_read, update_last_message
)
from app.services.message_service import create_message, list_messages, update_message_status
from app.services.case_service import get_or_create_case, get_case, update_case, list_cases, get_case_by_conversation
from app.services.wazzup_service import send_message as wazzup_send_message
