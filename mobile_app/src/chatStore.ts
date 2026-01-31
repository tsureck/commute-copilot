/**
 * Chat storage hook for managing conversation messages.
 */

import { useState, useCallback } from 'react';
import { ChatMessage } from './types';

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface UseChatStoreReturn {
  messages: ChatMessage[];
  addUserMessage: (text: string) => ChatMessage;
  addAssistantMessage: (text: string, audioBase64?: string, audioFormat?: 'mp3') => ChatMessage;
  clearMessages: () => void;
}

/**
 * Hook for managing chat messages in memory.
 * For the hackathon prototype, we keep messages in memory only.
 */
export function useChatStore(): UseChatStoreReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addUserMessage = useCallback((text: string): ChatMessage => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const addAssistantMessage = useCallback((
    text: string,
    audioBase64?: string,
    audioFormat?: 'mp3'
  ): ChatMessage => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      text,
      audioBase64,
      audioFormat,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
  };
}
