# app/models/video.py
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field

class Source(BaseModel):
    text: str
    timestamp: float
    url: str

class SummaryResponse(BaseModel):
    video_id: str
    title: str
    summary: str
    thumbnail: str

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[Source]

class VideoSchema(BaseModel):
    video_id: str
    video_name: str
    channel_name: str
    origin_script: List[Dict[str, Any]] | None = None
    scripts: List[str] | None = None
    
    # ObjectId를 처리하기 위한 추가 필드
    id: Optional[str] = Field(None, alias="_id")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }