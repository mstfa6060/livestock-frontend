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

  // Connect to SignalR and join conversation
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;

    const initializeChat = async () => {
      setIsConnecting(true);
      try {
        await chatService.connect();
        if (isMounted) {
          setIsConnected(true);
          await chatService.joinConversation(conversationId);
        }
      } catch (error) {
        console.error("SignalR baglanti hatasi:", error);
        if (isMounted) {
          setIsConnected(false);
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      chatService.leaveConversation(conversationId).catch(console.error);
    };
  }, [conversationId]);

  // Message handlers
  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        onNewMessage?.(message);
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
  }, [isConnected, conversationId, onNewMessage]);

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
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await chatService.sendTypingIndicator(conversationId, false);
        } catch (error) {
          console.error("Typing indicator gonderme hatasi:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Typing indicator gonderme hatasi:", error);
    }
  }, [conversationId, isConnected]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!isConnected) return;
    try {
      await chatService.markMessageAsRead(messageId);
    } catch (error) {
      console.error("Mesaj okundu olarak isaretlenemedi:", error);
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
