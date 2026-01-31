"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Required
    elevenlabs_api_key: str = Field(
        ...,
        description="ElevenLabs API key (required)",
    )

    # Optional with defaults
    elevenlabs_base_url: str = Field(
        default="https://api.elevenlabs.io",
        description="ElevenLabs API base URL",
    )
    elevenlabs_voice_name: str = Field(
        default="Matilda",
        description="Voice name to use for TTS",
    )
    elevenlabs_voice_id: Optional[str] = Field(
        default=None,
        description="Voice ID to use for TTS (bypasses voice name lookup if set)",
    )
    elevenlabs_tts_model: str = Field(
        default="eleven_multilingual_v2",
        description="ElevenLabs TTS model ID",
    )

    app_host: str = Field(
        default="0.0.0.0",
        description="Host to bind the server",
    )
    app_port: int = Field(
        default=8000,
        description="Port to bind the server",
    )

    cors_allow_origins: str = Field(
        default="*",
        description="Comma-separated list of allowed CORS origins, or '*' for all",
    )

    http_timeout_seconds: int = Field(
        default=30,
        description="HTTP request timeout in seconds",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        if self.cors_allow_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_allow_origins.split(",")]

    @field_validator("elevenlabs_api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Ensure API key is not empty."""
        if not v or not v.strip():
            raise ValueError("ELEVENLABS_API_KEY must not be empty")
        return v.strip()


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
