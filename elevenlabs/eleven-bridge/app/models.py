"""Pydantic models for request/response validation."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


# Allowed audio formats for STT
AudioFormat = Literal["m4a", "mp3", "wav", "webm"]


class SpeechToTextRequest(BaseModel):
    """Request model for speech-to-text endpoint."""

    decisionId: str = Field(
        ...,
        min_length=1,
        description="Unique identifier for the decision context",
    )
    audio: str = Field(
        ...,
        min_length=1,
        description="Base64-encoded audio data (no data URL prefix)",
    )
    audioFormat: AudioFormat = Field(
        ...,
        description="Audio format: m4a, mp3, wav, or webm",
    )

    @field_validator("decisionId")
    @classmethod
    def validate_decision_id(cls, v: str) -> str:
        """Ensure decisionId is not just whitespace."""
        if not v.strip():
            raise ValueError("decisionId must not be empty or whitespace")
        return v.strip()

    @field_validator("audio")
    @classmethod
    def validate_audio_not_empty(cls, v: str) -> str:
        """Ensure audio is not just whitespace."""
        if not v.strip():
            raise ValueError("audio must not be empty or whitespace")
        return v


class SpeechToTextResponse(BaseModel):
    """Response model for speech-to-text endpoint."""

    text: str = Field(
        ...,
        description="Transcribed text from the audio",
    )


class TextToSpeechRequest(BaseModel):
    """Request model for text-to-speech endpoint."""

    decisionId: str = Field(
        ...,
        min_length=1,
        description="Unique identifier for the decision context",
    )
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Text to convert to speech (max 5000 characters)",
    )

    @field_validator("decisionId")
    @classmethod
    def validate_decision_id(cls, v: str) -> str:
        """Ensure decisionId is not just whitespace."""
        if not v.strip():
            raise ValueError("decisionId must not be empty or whitespace")
        return v.strip()

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        """Ensure text is not just whitespace."""
        if not v.strip():
            raise ValueError("text must not be empty or whitespace")
        return v


class TextToSpeechResponse(BaseModel):
    """Response model for text-to-speech endpoint."""

    audio: str = Field(
        ...,
        description="Base64-encoded MP3 audio data",
    )
    audioFormat: Literal["mp3"] = Field(
        default="mp3",
        description="Audio format (always mp3)",
    )


class ErrorResponse(BaseModel):
    """Standard error response model."""

    detail: str = Field(
        ...,
        description="Human-readable error message",
    )
