from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Money Intelligence"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "sqlite+pysqlite:///./app/database/sqlite.db"

    DATABASE_ECHO: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()