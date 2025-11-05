from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Money Intelligence"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "sqlite+pysqlite:///./data/money_intelligence.db"
    DATABASE_ECHO: bool = True

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3000

    ANTHROPIC_API_KEY: str

    # Phoenix Observability
    PHOENIX_ENABLED: bool = True
    PHOENIX_HOST: str = "localhost"
    PHOENIX_PORT: int = 6006
    PHOENIX_PROJECT_NAME: str = "money-intelligence"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()