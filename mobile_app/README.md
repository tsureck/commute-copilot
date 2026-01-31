# Commute Copilot - Mobile App

A cross-platform mobile application built with Expo (React Native + TypeScript) that serves as your intelligent commute assistant. Features full voice-to-voice conversation with speech-to-text and text-to-speech via ElevenLabs.

## Features

- 🎤 **Voice Input**: Record audio messages using the device microphone
- 📝 **Speech-to-Text**: Transcription via Eleven Bridge (ElevenLabs API)
- 🤖 **AI Responses**: Intelligent responses from n8n workflow backend
- 🔊 **Text-to-Speech**: Voice synthesis via Eleven Bridge (Matilda voice)
- ▶️ **Audio Playback**: Play stored audio responses on demand
- 🌙 **Modern UI**: Dark theme with glass morphism design elements

## Communication Flow

The app implements the following voice conversation flow:

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Mobile App  │────▶│  Eleven Bridge  │────▶│  ElevenLabs  │
│ (Recording) │     │  /speech_to_    │     │  STT API     │
│             │     │  text/          │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
       │                    │
       │            { text: "..." }
       ▼                    │
┌─────────────┐             │
│ Mobile App  │◀────────────┘
│ (Add User   │
│  Message)   │
└─────────────┘
       │
       │ POST /user_answer
       ▼
┌─────────────┐     ┌─────────────────┐
│    n8n      │────▶│   Mobile App    │
│ (Workflow)  │     │   (Display      │
│             │     │    Response)    │
└─────────────┘     └─────────────────┘
       │                    │
       │            POST /text_to_speech/
       │                    ▼
       │            ┌─────────────────┐
       │            │  Eleven Bridge  │
       │            │  (TTS via       │
       │            │   ElevenLabs)   │
       │            └─────────────────┘
       │                    │
       │            { audio: "base64" }
       │                    │
       │                    ▼
       │            ┌─────────────────┐
       └───────────▶│   Mobile App    │
                    │   (Store Audio  │
                    │    for Playback)│
                    └─────────────────┘
```

## Tech Stack

- **Expo** (~54.0.0) - Cross-platform React Native framework
- **TypeScript** - Type-safe JavaScript
- **expo-router** - File-based navigation
- **expo-av** - Audio playback and recording
- **expo-file-system** - File system access for base64 audio
- **expo-haptics** - Tactile feedback
- **react-native-reanimated** - Smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo Go app on your device (for testing) OR iOS Simulator / Android Emulator

### Installation

```bash
# Navigate to the mobile_app directory
cd mobile_app

# Install dependencies
npm install
```

### Configure Backend URLs

Edit `app/chat.tsx` and update the configuration constants:

```typescript
// Eleven Bridge FastAPI service for speech-to-text and text-to-speech
const ELEVEN_BRIDGE_BASE_URL = 'http://localhost:8000';

// n8n workflow backend for assistant responses
const N8N_BASE_URL = 'http://localhost:5678/webhook';
```

**For physical device testing**, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:8000`).

### Start Backend Services

Make sure the following services are running:

**Eleven Bridge** (port 8000):
```bash
cd ../elevenlabs/eleven-bridge
pip install -r requirements.txt
python -m app.main
```

**n8n** (port 5678):
```bash
# Start n8n with your workflow configured
npx n8n start
```

### Running the App

```bash
# Start the Expo development server
npx expo start
```

Then:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go app on your physical device

## Usage Guide

### Voice Conversation

1. Navigate to the **Chat** screen
2. **Hold the microphone button** to start recording
3. Speak your message
4. **Release the button** to send
5. Watch the loading states:
   - "Transcribing..." - Audio being converted to text
   - "Thinking..." - Waiting for n8n response
   - "Generating audio..." - TTS being generated
6. The assistant response appears with a **Play button**
7. Tap **Play** to hear the audio response

### Audio Playback

- Each assistant message has a stored audio response
- Tap the **▶ Play** button to listen
- Tap again to **⏹ Stop**
- Audio can be replayed without regenerating

## Project Structure

```
mobile_app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with navigation config
│   ├── index.tsx           # Home screen
│   ├── chat.tsx            # Main voice chat interface ⭐
│   ├── settings.tsx        # Settings screen
│   └── decision/
│       └── [decisionId].tsx # Dynamic decision screen
├── src/                    # Modular source code
│   ├── config.ts           # Base URLs configuration
│   ├── types.ts            # TypeScript type definitions
│   ├── api/                # API client modules
│   │   ├── elevenBridge.ts # Eleven Bridge API
│   │   ├── n8n.ts          # n8n API
│   │   └── index.ts        # Exports
│   ├── audio.ts            # Audio utilities
│   ├── chatStore.ts        # Chat state management
│   ├── useAudioRecorder.ts # Recording hook
│   ├── useAudioPlayer.ts   # Playback hook
│   └── components/         # New components
├── components/             # Legacy UI components
├── hooks/                  # Legacy hooks
├── api/                    # Legacy API client
├── theme/                  # Design tokens and theme
├── types/                  # Legacy type definitions
└── assets/                 # Static assets
```

## API Integration

### Eleven Bridge Endpoints

**POST /speech_to_text/**
```json
Request:
{
  "decisionId": "dec_u1_001",
  "audio": "base64_encoded_audio",
  "audioFormat": "m4a"
}

Response:
{
  "text": "transcribed text"
}
```

**POST /text_to_speech/**
```json
Request:
{
  "decisionId": "dec_u1_001",
  "text": "text to convert"
}

Response:
{
  "audio": "base64_encoded_mp3",
  "audioFormat": "mp3"
}
```

### n8n Endpoint

**POST /user_answer**
```json
Request:
{
  "decisionId": "dec_u1_001",
  "text": "user transcribed text"
}

Response:
{
  "id": "dec_u1_001",
  "role": "assistant",
  "text": "assistant response",
  "created_at": "2026-01-31T10:00:00.000Z"
}
```

## Data Types

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioBase64?: string;  // Base64 MP3 for assistant messages
  audioFormat?: 'mp3';
  created_at: string;
}
```

### LoadingState

```typescript
type LoadingState = 
  | 'idle'
  | 'recording'
  | 'transcribing'  // Sending to Eleven Bridge STT
  | 'thinking'      // Waiting for n8n response
  | 'generating'    // Getting TTS from Eleven Bridge
  | 'error';
```

## Troubleshooting

### "Network request failed"
- Ensure backend services are running
- Check that URLs in `app/chat.tsx` are correct
- For physical devices, use your computer's IP instead of `localhost`
- Check that your firewall allows connections on ports 8000 and 5678

### "Microphone permission not granted"
- Grant microphone permission when prompted
- Check device settings if permission was previously denied

### Audio not playing
- Ensure device is not in silent mode (iOS)
- Check that audio was generated successfully (no TTS errors in console)
- Verify Eleven Bridge is running and responding

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

## License

MIT
