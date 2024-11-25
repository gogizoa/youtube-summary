# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    YOUTUBE_API_KEY: str
    GEMINI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()