# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import video

app = FastAPI(
    title="YouTube Summary API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 비디오 라우터 등록
app.include_router(video.router, prefix="/api")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)