"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { chatService, Message, TypingIndicator } from "@/lib/chat/ChatService";

export interface UseChatOptions {
  conversationId: string;
  onNewMessage?: (message: Message) => void;
}

export const useChat = ({ conversationId, onNewMessage }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onNewMessageRef = useRef(onNewMessage);

  // Keep ref up to date without causing re-subscriptions
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Connect to SignalR and join conversation
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    const initializeChat = async () => {
      setIsConnecting(true);
      try {
        await chatService.connect();
        if (!cancelled) {
          setIsConnected(true);
          await chatService.joinConversation(conversationId);
        }
      } catch {
        if (!cancelled) {
          setIsConnected(false);
        }
      } finally {
        if (!cancelled) {
          setIsConnecting(false);
        }
      }
    };

    initializeChat();

    return () => {
      cancelled = true;
      chatService.leaveConversation(conversationId).catch(() => {});
    };
  }, [conversationId]);

  // Message handlers
  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        onNewMessageRef.current?.(message);
      }
    };

    const handleTypingIndicator = (indicator: TypingIndicator) => {
      if (indicator.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (indicator.isTyping) {
            newMap.set(indicator.userId, indicator.userName);
          } else {
            newMap.delete(indicator.userId);
          }
          return newMap;
        });
      }
    };

    const handleMessageRead = (data: { messageId: string; readAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, isRead: true, readAt: data.readAt } : m
        )
      );
    };

    chatService.onReceiveMessage(handleNewMessage);
    chatService.onTypingIndicator(handleTypingIndicator);
    chatService.onMessageRead(handleMessageRead);

    return () => {
      chatService.offReceiveMessage(handleNewMessage);
      chatService.offTypingIndicator(handleTypingIndicator);
      chatService.offMessageRead(handleMessageRead);
    };
  }, [isConnected, conversationId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    if (!conversationId || !isConnected) return;

    try {
      await chatService.sendTypingIndicator(conversationId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        chatService.sendTypingIndicator(conversationId, false).catch(() => {});
      }, 2000);
    } catch {
      // Typing indicator is non-critical, silently ignore
    }
  }, [conversationId, isConnected]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!isConnected) return;
    try {
      await chatService.markMessageAsRead(messageId);
    } catch {
      // Non-critical, silently ignore
    }
  }, [isConnected]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    setMessages,
    typingUsers,
    isConnected,
    isConnecting,
    sendTypingIndicator,
    markAsRead,
  };
};
