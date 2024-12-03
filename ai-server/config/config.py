# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    YOUTUBE_API_KEY: str
    GEMINI_API_KEY: str
    OPENAI_API_KEY: str

    MONGODB_USERNAME: str
    MONGODB_PASSWORD: str
    MONGODB_URI: str = "mongodb+srv://kang99086:<password>@youtubesummary.am1qy.mongodb.net/"
    MONGODB_DB_NAME: str

    @property
    def MONGODB_CONNECTION_URI(self) -> str:
        return self.MONGODB_URI.replace('<password>', self.MONGODB_PASSWORD)

    class Config:
        env_file = ".env"

settings = Settings()