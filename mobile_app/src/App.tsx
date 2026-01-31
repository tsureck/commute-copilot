/**
 * Main App entry point for the Commute Copilot mobile app.
 * 
 * This implements the new voice-based communication flow:
 * 1. Record audio → Eleven Bridge STT
 * 2. User text → n8n backend
 * 3. Assistant response → Eleven Bridge TTS
 * 4. Play audio response
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ChatScreen } from './ChatScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <ChatScreen />
    </>
  );
}
