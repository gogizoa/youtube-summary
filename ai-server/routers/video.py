# app/routers/video.py
from fastapi import APIRouter, HTTPException
from services.video_service import VideoService
from model.video import SummaryResponse, ChatRequest, ChatResponse

router = APIRouter()
video_service = VideoService()


@router.get("/summary/{video_id}", response_model=SummaryResponse)
async def get_video_summary(video_id: str):
    try:
        summary = await video_service.generate_summary(video_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/{video_id}", response_model=ChatResponse)
async def get_chat(video_id: str, request: ChatRequest):
    try:
        response = await video_service.chat(video_id, request.question)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
