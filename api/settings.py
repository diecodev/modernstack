from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    mongo_uri: str
    api_key: str
    storage_endpoint_url: str
    storage_access_key: str
    storage_secret_key: str
    bucket_name: str
    google_api_key: str
    redis_url: str
    redis_key_ttl_seconds: int
    qstash_token: str
    openai_api_key: str


settings = Settings()
