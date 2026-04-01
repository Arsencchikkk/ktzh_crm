import json
import logging
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections from CRM operators."""

    def __init__(self):
        # user_id -> list of websocket connections (multiple tabs)
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)
        logger.info(f"WS connected: user={user_id}, total_connections={self.total}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self._connections:
            try:
                self._connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info(f"WS disconnected: user={user_id}, total_connections={self.total}")

    @property
    def total(self) -> int:
        return sum(len(v) for v in self._connections.values())

    async def broadcast(self, event: dict[str, Any]):
        """Send event to ALL connected operators."""
        payload = json.dumps(event, default=str)
        dead: list[tuple[str, WebSocket]] = []
        for user_id, sockets in self._connections.items():
            for ws in sockets:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.append((user_id, ws))
        for user_id, ws in dead:
            self.disconnect(ws, user_id)

    async def send_to_user(self, user_id: str, event: dict[str, Any]):
        """Send event to a specific operator."""
        payload = json.dumps(event, default=str)
        sockets = self._connections.get(user_id, [])
        dead = []
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)


# Singleton
ws_manager = ConnectionManager()
