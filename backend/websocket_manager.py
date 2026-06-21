from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Active connections
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def import_connection(self, websocket: WebSocket):
        pass

    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

