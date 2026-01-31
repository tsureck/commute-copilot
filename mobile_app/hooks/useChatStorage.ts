import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';
import { generateId } from '../utils';

const CHAT_STORAGE_KEY = '@commute_copilot_chat_messages';

interface UseChatStorageReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'created_at'>) => Promise<ChatMessage>;
  clearMessages: () => Promise<void>;
  threadId: string;
}

export function useChatStorage(initialThreadId?: string): UseChatStorageReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [threadId] = useState(initialThreadId || generateId());

  const getStorageKey = useCallback(() => {
    return `${CHAT_STORAGE_KEY}_${threadId}`;
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [threadId]);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(getStorageKey());
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = async (newMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const addMessage = useCallback(async (
    messageData: Omit<ChatMessage, 'id' | 'created_at'>
  ): Promise<ChatMessage> => {
    const message: ChatMessage = {
      ...messageData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    const newMessages = [...messages, message];
    setMessages(newMessages);
    await saveMessages(newMessages);
    
    return message;
  }, [messages, getStorageKey]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    await AsyncStorage.removeItem(getStorageKey());
  }, [getStorageKey]);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages,
    threadId,
  };
}
