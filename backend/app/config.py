from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "KTZ CRM"
    DEBUG: bool = False

    # MongoDB
    MONGODB_URL: str = "mongodb://mongodb:27017"
    MONGODB_DB: str = "ktz_crm"

    # JWT
    SECRET_KEY: str = "change-me-in-production-very-secret-key-123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Wazzup
    WAZZUP_API_URL: str = "https://api.wazzup24.com/v3"
    WAZZUP_API_KEY: str = ""
    WAZZUP_CHANNEL_ID: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://frontend:3000"]


settings = Settings()
