from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Money Intelligence"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "sqlite+pysqlite:///./app/database/sqlite.db"
    DATABASE_ECHO: bool = True

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3000

    ANTHROPIC_API_KEY: str

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()