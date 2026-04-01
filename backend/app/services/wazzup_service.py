import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

WAZZUP_HEADERS = {
    "Authorization": f"Bearer {settings.WAZZUP_API_KEY}",
    "Content-Type": "application/json",
}


async def send_message(phone: str, text: str, channel_id: str | None = None) -> dict:
    """
    Send a WhatsApp message via Wazzup API.

    Docs: https://wazzup24.com/docs/
    POST /v3/message
    """
    ch = channel_id or settings.WAZZUP_CHANNEL_ID
    payload = {
        "channelId": ch,
        "chatType": "whatsapp",
        "chatId": phone,
        "text": text,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{settings.WAZZUP_API_URL}/message",
                json=payload,
                headers=WAZZUP_HEADERS,
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Wazzup send OK: messageId={data.get('messageId')}")
            return data
    except httpx.HTTPStatusError as e:
        logger.error(f"Wazzup HTTP error: {e.response.status_code} {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Wazzup error: {e}")
        raise


async def set_webhook(webhook_url: str) -> dict:
    """Register our webhook URL in Wazzup."""
    payload = {"webhooksUri": webhook_url}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.patch(
            f"{settings.WAZZUP_API_URL}/webhooks",
            json=payload,
            headers=WAZZUP_HEADERS,
        )
        resp.raise_for_status()
        return resp.json()
