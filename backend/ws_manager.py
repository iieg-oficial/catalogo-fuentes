from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, entity_type: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[entity_type].add(ws)

    def disconnect(self, entity_type: str, ws: WebSocket) -> None:
        self._connections[entity_type].discard(ws)

    async def broadcast(self, entity_type: str, data: str) -> None:
        dead: set[WebSocket] = set()
        for ws in self._connections[entity_type]:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        self._connections[entity_type] -= dead


manager = ConnectionManager()
