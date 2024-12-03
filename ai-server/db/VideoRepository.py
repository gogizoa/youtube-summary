from config.config import settings
from model.video import VideoSchema
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

class VideoRepository:
    def __init__(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_CONNECTION_URI)
        self.db = self.client[settings.MONGODB_DB_NAME]
        self.collection = self.db.video

    async def initialize(self):
        """인덱스 생성을 위한 초기화 메소드"""
        await self.collection.create_index([("video_id", 1)], unique=True)

    async def save(self, video: VideoSchema) -> Optional[VideoSchema]:
        """비디오 저장"""
        try:
            # Pydantic 모델을 dictionary로 변환
            result = await self.collection.insert_one(video.model_dump())

            if result.acknowledged:
                saved_doc = await self.collection.find_one({"video_id": video.video_id})
                if saved_doc:
                    saved_doc["_id"] = str(saved_doc["_id"])
                    
                    print("saved_doc", saved_doc)
                    print("result ",  VideoSchema(**saved_doc))

                    return VideoSchema(**saved_doc)
                
            return None
        except Exception as e:
            print(f"Error saving video: {e}")
            return None

    async def find_by_id(self, video_id: str) -> Optional[VideoSchema]:
        """video_id로 비디오 조회"""
        try:
            video_data = await self.collection.find_one({"video_id": video_id})
            if video_data:
                video_data["_id"] = str(video_data["_id"])
                return VideoSchema(**video_data)
            return None
        except Exception as e:
            print(f"Error finding video: {e}")
            return None
