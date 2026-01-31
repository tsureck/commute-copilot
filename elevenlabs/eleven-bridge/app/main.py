"""FastAPI application for Eleven Bridge service."""

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .elevenlabs_client import (
    ElevenLabsClient,
    ElevenLabsClientError,
    decode_base64_audio,
    encode_audio_to_base64,
)
from .models import (
    ErrorResponse,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TextToSpeechRequest,
    TextToSpeechResponse,
)
from .settings import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Global client instance
elevenlabs_client: ElevenLabsClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown."""
    global elevenlabs_client
    
    settings = get_settings()
    logger.info("Starting Eleven Bridge service...")
    logger.info(f"ElevenLabs base URL: {settings.elevenlabs_base_url}")
    logger.info(f"Target voice name: {settings.elevenlabs_voice_name}")
    logger.info(f"TTS model: {settings.elevenlabs_tts_model}")
    
    # Initialize ElevenLabs client
    elevenlabs_client = ElevenLabsClient(settings)
    
    try:
        await elevenlabs_client.initialize()
        logger.info("ElevenLabs client initialized successfully")
    except ElevenLabsClientError as e:
        logger.error(f"Failed to initialize ElevenLabs client: {e.message}")
        raise RuntimeError(f"Startup failed: {e.message}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Eleven Bridge service...")
    if elevenlabs_client:
        await elevenlabs_client.close()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Eleven Bridge",
    description="FastAPI microservice bridging mobile app to ElevenLabs API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "eleven-bridge"}


@app.post(
    "/speech_to_text/",
    response_model=SpeechToTextResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        502: {"model": ErrorResponse, "description": "ElevenLabs API error"},
    },
)
async def speech_to_text(request: SpeechToTextRequest) -> SpeechToTextResponse:
    """
    Convert speech to text using ElevenLabs API.
    
    - **decisionId**: Unique identifier for the decision context
    - **audio**: Base64-encoded audio data (no data URL prefix)
    - **audioFormat**: Audio format (m4a, mp3, wav, webm)
    """
    logger.info(f"[{request.decisionId}] POST /speech_to_text/ - format: {request.audioFormat}")
    
    if not elevenlabs_client:
        logger.error(f"[{request.decisionId}] ElevenLabs client not initialized")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready",
        )
    
    # Decode base64 audio
    try:
        audio_bytes = decode_base64_audio(request.audio)
        logger.info(f"[{request.decisionId}] Decoded audio: {len(audio_bytes)} bytes")
    except ValueError as e:
        logger.warning(f"[{request.decisionId}] Invalid base64 audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid base64 audio data: {str(e)}",
        )
    
    # Call ElevenLabs API
    try:
        text = await elevenlabs_client.speech_to_text(
            audio_bytes=audio_bytes,
            audio_format=request.audioFormat,
            decision_id=request.decisionId,
        )
        return SpeechToTextResponse(text=text)
    
    except ElevenLabsClientError as e:
        logger.error(f"[{request.decisionId}] ElevenLabs API error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs API error: {e.message}",
        )


@app.post(
    "/text_to_speech/",
    response_model=TextToSpeechResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        502: {"model": ErrorResponse, "description": "ElevenLabs API error"},
    },
)
async def text_to_speech(request: TextToSpeechRequest) -> TextToSpeechResponse:
    """
    Convert text to speech using ElevenLabs API.
    
    - **decisionId**: Unique identifier for the decision context
    - **text**: Text to convert to speech (max 5000 characters)
    """
    logger.info(f"[{request.decisionId}] POST /text_to_speech/ - text length: {len(request.text)}")
    
    if not elevenlabs_client:
        logger.error(f"[{request.decisionId}] ElevenLabs client not initialized")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready",
        )
    
    # Call ElevenLabs API
    try:
        audio_bytes = await elevenlabs_client.text_to_speech(
            text=request.text,
            decision_id=request.decisionId,
        )
        
        # Encode to base64
        audio_base64 = encode_audio_to_base64(audio_bytes)
        logger.info(f"[{request.decisionId}] Generated audio: {len(audio_bytes)} bytes")
        
        return TextToSpeechResponse(audio=audio_base64, audioFormat="mp3")
    
    except ElevenLabsClientError as e:
        logger.error(f"[{request.decisionId}] ElevenLabs API error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs API error: {e.message}",
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """Global exception handler for unexpected errors."""
    logger.exception(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
    )


def main() -> None:
    """Run the application using uvicorn."""
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=False,
    )


if __name__ == "__main__":
    main()
