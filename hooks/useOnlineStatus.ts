"use client";

import { useEffect, useState, useRef } from "react";
import { chatService } from "@/lib/chat/ChatService";

/**
 * Hook to track online/offline status of multiple users via SignalR.
 * Connects to SignalR if not already connected, queries initial status,
 * then listens for real-time online/offline events.
 */
export function useOnlineStatus(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userIds.length === 0) return;

    let cancelled = false;

    const init = async () => {
      try {
        await chatService.connect();
        if (cancelled) return;

        const result = await chatService.getOnlineUsers(userIds);
        if (cancelled || !isMountedRef.current) return;

        const online = new Set(
          result.filter((u) => u.isOnline).map((u) => u.userId)
        );
        setOnlineUsers(online);
        setIsReady(true);
      } catch {
        // SignalR not available, all users shown as offline
      }
    };

    init();

    const handleUserOnline = (data: { userId: string }) => {
      if (userIds.includes(data.userId)) {
        setOnlineUsers((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    chatService.onUserOnline(handleUserOnline);
    chatService.onUserOffline(handleUserOffline);

    return () => {
      cancelled = true;
      chatService.offUserOnline(handleUserOnline);
      chatService.offUserOffline(handleUserOffline);
    };
  }, [userIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { onlineUsers, isReady, isOnline: (userId: string) => onlineUsers.has(userId) };
}
