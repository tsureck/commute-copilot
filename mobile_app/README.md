# Commute Copilot - Mobile App

A cross-platform mobile application built with Expo (React Native + TypeScript) that serves as your intelligent commute assistant. Features a modern AI copilot aesthetic with dark navy theme, glassy cards, and smooth animations.

## Features

- 🏠 **Home Screen**: Quick status overview with train, weather, and traffic updates
- 📋 **Decision Screen**: Detailed commute recommendations with audio narration
- 💬 **Chat Screen**: Full conversation interface with AI assistant
- 🎤 **Voice Input**: Record voice messages (mock STT for demo)
- 🔔 **Notifications**: Local notifications with deep linking
- ⚙️ **Settings**: Configure mock/live mode, autoplay, and accessibility options

## Tech Stack

- **Expo** (~52.0.0) - Cross-platform React Native framework
- **TypeScript** - Type-safe JavaScript
- **expo-router** - File-based navigation
- **expo-av** - Audio playback and recording
- **expo-notifications** - Local and push notifications
- **expo-linear-gradient** - Background gradients
- **expo-haptics** - Tactile feedback
- **react-native-reanimated** - Smooth animations
- **@react-native-async-storage/async-storage** - Local data persistence

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

# (Optional) Generate placeholder app icons
npm run generate-assets
```

> **Note**: The app will work without icons during development. For production, replace the placeholder images in `assets/` with proper icons.

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

### Testing Notifications

1. Open the app and navigate to the Home screen
2. Tap **"Send Test Notification"**
3. Wait 2 seconds for the notification to appear
4. Tap the notification to navigate to the Decision screen

> **Note**: On iOS, notifications won't appear if the app is in the foreground. Minimize the app or lock your device to see the notification banner.

### Testing Notification Tap Routing

1. Send a test notification (as above)
2. If on a physical device, lock the screen or switch to another app
3. When the notification appears, tap it
4. The app will open directly to the Decision screen (`/decision/demo-001`)

### Switching Between Mock and Real Backend

1. Navigate to **Settings** (gear icon or "Settings" button on Home)
2. Toggle **"Use Mock Backend"**:
   - **ON** (default): Uses simulated data with realistic delays
   - **OFF**: Connects to the backend URL specified in "Base URL"
3. When using live mode, ensure your backend implements these endpoints:
   - `GET /decisions/{decisionId}` - Returns Decision object
   - `POST /chat` - Accepts `{ thread_id, messages, user_text }`, returns ChatMessage

### Voice Recording

1. On the Decision or Chat screen, tap the **microphone button**
2. Speak your message
3. Tap the microphone again to stop recording
4. In mock mode, a random placeholder transcription is used
5. The structure supports swapping in a real STT service later

### Audio Playback

- Audio auto-plays on the Decision screen if **"Autoplay Voice"** is enabled in Settings
- Tap the play/pause button to control playback
- Progress bar shows current position

## Project Structure

```
mobile_app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with navigation config
│   ├── index.tsx           # Home screen
│   ├── chat.tsx            # Full chat interface
│   ├── settings.tsx        # Settings screen
│   └── decision/
│       └── [decisionId].tsx # Dynamic decision screen
├── api/
│   ├── client.ts           # API client (switches mock/live)
│   └── mock.ts             # Mock data and responses
├── components/
│   ├── AnimatedWaveform.tsx
│   ├── AudioControls.tsx
│   ├── Button.tsx
│   ├── ChatBubble.tsx
│   ├── ConfidencePill.tsx
│   ├── ConversationDock.tsx
│   ├── GlassCard.tsx
│   ├── QuickReplyChips.tsx
│   ├── SettingsRow.tsx
│   ├── StatusPreviewCard.tsx
│   └── UpdateIcon.tsx
├── hooks/
│   ├── useAudioPlayer.ts   # Audio playback hook
│   ├── useAudioRecorder.ts # Voice recording hook
│   ├── useChatStorage.ts   # Message persistence
│   ├── useNotifications.ts # Notification handling
│   └── useSettings.ts      # App settings
├── theme/
│   └── tokens.ts           # Design tokens (colors, spacing, etc.)
├── types/
│   └── index.ts            # TypeScript interfaces
├── assets/                 # App icons and images
├── app.json                # Expo configuration
├── package.json
└── tsconfig.json
```

## Data Types

### Decision

```typescript
interface Decision {
  id: string;
  title: string;
  updates: Array<{
    type: 'weather' | 'train' | 'calendar' | 'traffic';
    text: string;
  }>;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  audio_url: string;
  created_at: string;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audio_url?: string;
  created_at: string;
}
```

## API Endpoints (for Real Backend)

When `useMockBackend` is disabled, the app calls:

### GET `/decisions/{decisionId}`

Returns a Decision object.

### POST `/chat`

Request body:
```json
{
  "thread_id": "uuid",
  "messages": [...previous messages],
  "user_text": "user's message"
}
```

Returns a ChatMessage object.

## Customization

### Theme

Edit `theme/tokens.ts` to customize:
- Colors (background, accent, text, etc.)
- Spacing values
- Border radius
- Typography sizes
- Animation durations

### Mock Data

Edit `api/mock.ts` to customize:
- Sample decisions
- Assistant responses
- Audio URLs

## Accessibility

- **Reduce Motion**: Disables animations throughout the app
- High contrast text on dark background
- Touch targets sized for accessibility (44px minimum)
- Screen reader compatible components

## Troubleshooting

### Notifications not appearing on iOS

Notifications won't show as banners when the app is in the foreground. Minimize the app or use a different approach for in-app alerts.

### Audio not playing

- Ensure device is not in silent mode (iOS)
- Check that the audio URL is accessible
- Verify network connectivity

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

## License

MIT
