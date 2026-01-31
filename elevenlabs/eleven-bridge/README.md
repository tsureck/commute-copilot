# Eleven Bridge

A production-ready FastAPI microservice that bridges mobile applications to the ElevenLabs API for speech-to-text and text-to-speech functionality.

## Features

- **Speech-to-Text**: Convert audio to text using ElevenLabs' Scribe model
- **Text-to-Speech**: Generate natural speech using the Matilda voice (configurable)
- **Robust Error Handling**: Graceful handling of API errors and timeouts
- **CORS Support**: Configurable CORS for development and production
- **Structured Logging**: Decision ID tracking without logging sensitive data

## Quick Start

### 1. Install Dependencies

```bash
cd eleven-bridge
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and add your ElevenLabs API key:

```bash
cp .env.example .env
```

Edit `.env` and set your `ELEVENLABS_API_KEY`:

```
ELEVENLABS_API_KEY=your_actual_api_key_here
```

### 3. Run the Server

```bash
python -m app.main
```

Or using uvicorn directly:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`.

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "healthy", "service": "eleven-bridge"}
```

### POST /speech_to_text/

Convert audio to text.

**Request:**
```bash
curl -X POST http://localhost:8000/speech_to_text/ \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "dec_u1_001",
    "audio": "BASE64_ENCODED_AUDIO_HERE",
    "audioFormat": "m4a"
  }'
```

**Response:**
```json
{
  "text": "Transcribed text from the audio"
}
```

**Supported audio formats:** `m4a`, `mp3`, `wav`, `webm`

### POST /text_to_speech/

Convert text to speech.

**Request:**
```bash
curl -X POST http://localhost:8000/text_to_speech/ \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "dec_u1_001",
    "text": "Hello, this is a test of the text to speech system."
  }'
```

**Response:**
```json
{
  "audio": "BASE64_ENCODED_MP3_AUDIO",
  "audioFormat": "mp3"
}
```

**Constraints:**
- Text must be between 1 and 5000 characters

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | Yes | - | Your ElevenLabs API key |
| `ELEVENLABS_BASE_URL` | No | `https://api.elevenlabs.io` | ElevenLabs API base URL |
| `ELEVENLABS_VOICE_NAME` | No | `Matilda` | Voice name for TTS |
| `ELEVENLABS_VOICE_ID` | No | - | Voice ID for TTS (bypasses voice name lookup) |
| `ELEVENLABS_TTS_MODEL` | No | `eleven_multilingual_v2` | TTS model ID |
| `APP_HOST` | No | `0.0.0.0` | Server host |
| `APP_PORT` | No | `8000` | Server port |
| `CORS_ALLOW_ORIGINS` | No | `*` | CORS origins (comma-separated or `*`) |
| `HTTP_TIMEOUT_SECONDS` | No | `30` | HTTP request timeout |

## Error Responses

### 422 Unprocessable Entity

Returned when validation fails:

```json
{
  "detail": "Invalid base64 audio data: ..."
}
```

### 502 Bad Gateway

Returned when ElevenLabs API returns an error:

```json
{
  "detail": "ElevenLabs API error: ..."
}
```

## Project Structure

```
eleven-bridge/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # FastAPI application and routes
│   ├── settings.py          # Configuration management
│   ├── models.py            # Pydantic request/response models
│   └── elevenlabs_client.py # ElevenLabs API wrapper
├── requirements.txt         # Python dependencies
├── .env.example            # Example environment configuration
└── README.md               # This file
```

## Development

### API Documentation

When the server is running, interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Testing with curl

**Speech to Text (example with base64 audio):**

```bash
# First, encode your audio file to base64
base64 -i your_audio.m4a -o audio_base64.txt

# Then use it in the request
curl -X POST http://localhost:8000/speech_to_text/ \
  -H "Content-Type: application/json" \
  -d "{
    \"decisionId\": \"test_001\",
    \"audio\": \"$(cat audio_base64.txt)\",
    \"audioFormat\": \"m4a\"
  }"
```

**Text to Speech (save output to file):**

```bash
# Get the base64 audio and decode it
curl -X POST http://localhost:8000/text_to_speech/ \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "test_001",
    "text": "This is a test of the Eleven Bridge text to speech service."
  }' | python -c "import sys, json, base64; data = json.load(sys.stdin); print(base64.b64decode(data['audio']).decode('latin-1'))" > output.mp3
```

Or using jq:

```bash
curl -s -X POST http://localhost:8000/text_to_speech/ \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "test_001",
    "text": "This is a test."
  }' | jq -r '.audio' | base64 -d > output.mp3
```

## License

MIT
