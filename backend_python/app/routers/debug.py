from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/api/debug", tags=["debug"])

LOG_FILE = Path("debug.log")

class LogEntry(BaseModel):
    location: str
    message: str
    data: dict
    timestamp: int
    sessionId: str
    runId: Optional[str] = None
    hypothesisId: Optional[str] = None

@router.post("/logs")
async def receive_log(log_entry: LogEntry):
    """Принимает лог-запись от фронтенда"""
    try:
        log_data = {
            "location": log_entry.location,
            "message": log_entry.message,
            "data": log_entry.data,
            "timestamp": log_entry.timestamp,
            "sessionId": log_entry.sessionId,
            "runId": log_entry.runId,
            "hypothesisId": log_entry.hypothesisId,
        }
        
        # Записываем в файл
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        
        return {"status": "ok"}
    except Exception as e:
        print(f"[DEBUG] Error writing log: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_logs(limit: int = 1000, sessionId: Optional[str] = None):
    """Получает последние логи"""
    try:
        if not LOG_FILE.exists():
            return {"logs": [], "total": 0}
        
        logs = []
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        # Читаем с конца (последние логи)
        for line in reversed(lines[-limit:]):
            try:
                log_data = json.loads(line.strip())
                if sessionId is None or log_data.get("sessionId") == sessionId:
                    logs.append(log_data)
            except json.JSONDecodeError:
                continue
        
        # Возвращаем в правильном порядке (старые -> новые)
        logs.reverse()
        
        return {
            "logs": logs,
            "total": len(logs),
            "sessionId": sessionId or "all"
        }
    except Exception as e:
        print(f"[DEBUG] Error reading logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/logs")
async def clear_logs():
    """Очищает файл логов"""
    try:
        if LOG_FILE.exists():
            LOG_FILE.unlink()
        return {"status": "ok", "message": "Logs cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

