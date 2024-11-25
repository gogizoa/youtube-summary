# app/models/video.py
from typing import List

from pydantic import BaseModel

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
    sources: List[str]