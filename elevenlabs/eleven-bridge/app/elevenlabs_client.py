"""ElevenLabs API client wrapper."""

import base64
import logging
from typing import Optional

import httpx

from .settings import Settings

logger = logging.getLogger(__name__)


class ElevenLabsClientError(Exception):
    """Custom exception for ElevenLabs API errors."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ElevenLabsClient:
    """Async client for ElevenLabs API."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = settings.elevenlabs_base_url.rstrip("/")
        self.api_key = settings.elevenlabs_api_key
        self.timeout = settings.http_timeout_seconds
        self.voice_id: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def headers(self) -> dict[str, str]:
        """Default headers for API requests."""
        return {
            "xi-api-key": self.api_key,
        }

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                headers=self.headers,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def resolve_voice_id(self, voice_name: str) -> str:
        """
        Resolve a voice name to its ID by fetching the voices list.
        
        Args:
            voice_name: The name of the voice to find.
            
        Returns:
            The voice ID.
            
        Raises:
            ElevenLabsClientError: If the voice is not found or API call fails.
        """
        logger.info(f"Resolving voice name '{voice_name}' to voice ID")
        
        client = await self.get_client()
        url = f"{self.base_url}/v1/voices"

        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            voices = data.get("voices", [])
            for voice in voices:
                if voice.get("name", "").lower() == voice_name.lower():
                    voice_id = voice.get("voice_id")
                    logger.info(f"Resolved voice '{voice_name}' to ID: {voice_id}")
                    return voice_id

            available_voices = [v.get("name") for v in voices]
            raise ElevenLabsClientError(
                f"Voice '{voice_name}' not found. Available voices: {available_voices}"
            )

        except httpx.TimeoutException:
            raise ElevenLabsClientError("Timeout while fetching voices list")
        except httpx.HTTPStatusError as e:
            raise ElevenLabsClientError(
                f"Failed to fetch voices: {e.response.status_code}",
                status_code=e.response.status_code,
            )
        except httpx.RequestError as e:
            raise ElevenLabsClientError(f"Network error while fetching voices: {str(e)}")

    async def initialize(self) -> None:
        """
        Initialize the client by resolving the voice ID.
        Must be called before using TTS.
        
        Raises:
            ElevenLabsClientError: If voice resolution fails.
        """
        # If voice ID is provided directly, use it (bypasses voices_read permission requirement)
        if self.settings.elevenlabs_voice_id:
            self.voice_id = self.settings.elevenlabs_voice_id
            logger.info(f"Using voice ID from environment: {self.voice_id}")
        else:
            # Try to resolve voice name to ID
            try:
                self.voice_id = await self.resolve_voice_id(self.settings.elevenlabs_voice_name)
            except ElevenLabsClientError as e:
                if "401" in str(e.status_code) or "missing_permissions" in e.message.lower():
                    raise ElevenLabsClientError(
                        f"Cannot resolve voice name '{self.settings.elevenlabs_voice_name}' - API key lacks 'voices_read' permission. "
                        f"Set ELEVENLABS_VOICE_ID directly in .env (e.g., ELEVENLABS_VOICE_ID=XrExE9yKIg1WjnnlVkGX for Matilda)"
                    )
                raise
        logger.info(f"ElevenLabs client initialized with voice ID: {self.voice_id}")

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        audio_format: str,
        decision_id: str,
    ) -> str:
        """
        Convert speech to text using ElevenLabs API.
        
        Args:
            audio_bytes: Raw audio bytes.
            audio_format: Audio format (m4a, mp3, wav, webm).
            decision_id: Decision ID for logging.
            
        Returns:
            Transcribed text.
            
        Raises:
            ElevenLabsClientError: If the API call fails.
        """
        logger.info(f"[{decision_id}] Starting speech-to-text conversion")
        
        client = await self.get_client()
        url = f"{self.base_url}/v1/speech-to-text"

        # Map format to MIME type
        mime_types = {
            "m4a": "audio/mp4",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "webm": "audio/webm",
        }
        mime_type = mime_types.get(audio_format, "audio/mpeg")
        filename = f"audio.{audio_format}"

        try:
            # Send as multipart/form-data
            files = {
                "file": (filename, audio_bytes, mime_type),
            }
            data = {
                "model_id": "scribe_v1",  # ElevenLabs STT model
            }

            response = await client.post(url, files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            text = result.get("text", "")
            
            logger.info(f"[{decision_id}] Speech-to-text completed, text length: {len(text)}")
            return text

        except httpx.TimeoutException:
            logger.error(f"[{decision_id}] Timeout during speech-to-text")
            raise ElevenLabsClientError("Timeout while processing speech-to-text request")
        except httpx.HTTPStatusError as e:
            logger.error(f"[{decision_id}] STT API error: {e.response.status_code}")
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("detail", {}).get("message", str(error_data))
            except Exception:
                error_detail = e.response.text[:200] if e.response.text else "Unknown error"
            raise ElevenLabsClientError(
                f"ElevenLabs STT error: {error_detail}",
                status_code=e.response.status_code,
            )
        except httpx.RequestError as e:
            logger.error(f"[{decision_id}] Network error during STT: {str(e)}")
            raise ElevenLabsClientError(f"Network error during speech-to-text: {str(e)}")

    async def text_to_speech(
        self,
        text: str,
        decision_id: str,
    ) -> bytes:
        """
        Convert text to speech using ElevenLabs API.
        
        Args:
            text: Text to convert.
            decision_id: Decision ID for logging.
            
        Returns:
            MP3 audio bytes.
            
        Raises:
            ElevenLabsClientError: If the API call fails or voice not initialized.
        """
        if not self.voice_id:
            raise ElevenLabsClientError("Voice ID not initialized. Call initialize() first.")

        logger.info(f"[{decision_id}] Starting text-to-speech conversion, text length: {len(text)}")
        
        client = await self.get_client()
        url = f"{self.base_url}/v1/text-to-speech/{self.voice_id}"

        try:
            payload = {
                "text": text,
                "model_id": self.settings.elevenlabs_tts_model,
                "output_format": "mp3_44100_128",  # High quality MP3
            }

            response = await client.post(
                url,
                json=payload,
                headers={
                    **self.headers,
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            
            audio_bytes = response.content
            logger.info(f"[{decision_id}] Text-to-speech completed, audio size: {len(audio_bytes)} bytes")
            return audio_bytes

        except httpx.TimeoutException:
            logger.error(f"[{decision_id}] Timeout during text-to-speech")
            raise ElevenLabsClientError("Timeout while processing text-to-speech request")
        except httpx.HTTPStatusError as e:
            logger.error(f"[{decision_id}] TTS API error: {e.response.status_code}")
            error_detail = "Unknown error"
            try:
                error_data = e.response.json()
                error_detail = error_data.get("detail", {}).get("message", str(error_data))
            except Exception:
                error_detail = e.response.text[:200] if e.response.text else "Unknown error"
            raise ElevenLabsClientError(
                f"ElevenLabs TTS error: {error_detail}",
                status_code=e.response.status_code,
            )
        except httpx.RequestError as e:
            logger.error(f"[{decision_id}] Network error during TTS: {str(e)}")
            raise ElevenLabsClientError(f"Network error during text-to-speech: {str(e)}")


def decode_base64_audio(base64_string: str) -> bytes:
    """
    Decode a base64 string to bytes.
    
    Args:
        base64_string: Base64-encoded audio data.
        
    Returns:
        Decoded bytes.
        
    Raises:
        ValueError: If the string is not valid base64.
    """
    try:
        # Remove any whitespace
        clean_base64 = base64_string.strip()
        return base64.b64decode(clean_base64)
    except Exception as e:
        raise ValueError(f"Invalid base64 audio data: {str(e)}")


def encode_audio_to_base64(audio_bytes: bytes) -> str:
    """
    Encode bytes to a base64 string.
    
    Args:
        audio_bytes: Raw audio bytes.
        
    Returns:
        Base64-encoded string.
    """
    return base64.b64encode(audio_bytes).decode("utf-8")
