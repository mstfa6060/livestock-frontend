"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format, isToday, isYesterday } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { IAMAPI } from "@/api/base_modules/iam";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCheck,
  Check,
  Circle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  content: string;
  attachmentUrls: string | null;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  participantUserId1: string;
  participantUserId2: string;
  productId?: string;
  subject: string;
  status: number;
  lastMessageAt?: string;
  createdAt: string;
}

interface OtherUser {
  id: string;
  displayName: string;
  initials: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
}

export default function ConversationPage() {
  const t = useTranslations("messages");
  const locale = useLocale();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use chat hook for real-time messaging
  const {
    messages,
    setMessages,
    typingUsers,
    isConnected,
    isConnecting,
    sendTypingIndicator,
    markAsRead,
  } = useChat({
    conversationId,
    onNewMessage: (message) => {
      // Mark as read if the message is from the other user
      if (message.senderUserId !== user?.id) {
        markAsRead(message.id);
      }
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation details and messages
  useEffect(() => {
    const fetchData = async () => {
      if (!conversationId || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch conversation
        const convResponse = await LivestockTradingAPI.Conversations.Detail.Request({
          id: conversationId,
        });
        setConversation({
          ...convResponse,
          lastMessageAt: convResponse.lastMessageAt?.toString(),
          createdAt: convResponse.createdAt.toString(),
        });

        // Determine other user
        const otherUserId =
          convResponse.participantUserId1 === user.id
            ? convResponse.participantUserId2
            : convResponse.participantUserId1;

        // Fetch other user details
        try {
          const userDetail = await IAMAPI.Users.Detail.Request({
            userId: otherUserId,
          });
          const displayName = userDetail.fullName || userDetail.userName || "Kullanici";
          setOtherUser({
            id: otherUserId,
            displayName,
            initials: displayName
              .split(" ")
              .map((n: string) => n.charAt(0))
              .join("")
              .toUpperCase()
              .slice(0, 2),
          });
        } catch {
          setOtherUser({
            id: otherUserId,
            displayName: "Kullanici",
            initials: "?",
          });
        }

        // Fetch product if exists
        if (convResponse.productId) {
          try {
            const productResponse = await LivestockTradingAPI.Products.Detail.Request({
              id: convResponse.productId,
            });
            setProduct({
              id: productResponse.id,
              title: productResponse.title,
              slug: productResponse.slug,
            });
          } catch {
            // Product may have been deleted
          }
        }

        // Fetch messages
        const messagesResponse = await LivestockTradingAPI.Messages.All.Request({
          sorting: {
            key: "sentAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [
            {
              key: "conversationId",
              type: "guid",
              isUsed: true,
              values: [conversationId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: true },
        });

        setMessages(
          messagesResponse.map((msg) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderUserId: msg.senderUserId,
            recipientUserId: msg.recipientUserId,
            content: msg.content,
            attachmentUrls: null,
            isRead: msg.isRead,
            sentAt: msg.sentAt.toString(),
            createdAt: msg.createdAt.toString(),
          }))
        );

        // Mark unread messages as read
        const unreadMessages = messagesResponse.filter(
          (msg) => !msg.isRead && msg.senderUserId !== user.id
        );
        for (const msg of unreadMessages) {
          try {
            await LivestockTradingAPI.Messages.Update.Request({
              id: msg.id,
              content: msg.content,
              attachmentUrls: "",
              isRead: true,
            });
          } catch {
            // Continue even if marking as read fails
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [conversationId, user?.id, t, setMessages]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversation || !user || !otherUser || isSending)
      return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const response = await LivestockTradingAPI.Messages.Create.Request({
        conversationId: conversation.id,
        senderUserId: user.id,
        recipientUserId: otherUser.id,
        content: messageContent,
        attachmentUrls: "",
      });

      // Add message to local state (SignalR should also deliver it)
      const newMsg: Message = {
        id: response.id,
        conversationId: response.conversationId,
        senderUserId: response.senderUserId,
        recipientUserId: response.recipientUserId,
        content: response.content,
        attachmentUrls: response.attachmentUrls,
        isRead: false,
        sentAt: response.sentAt.toString(),
        createdAt: response.createdAt.toString(),
      };

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(t("sendError"));
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  }, [newMessage, conversation, user, otherUser, isSending, t, setMessages]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateLocale = locale === "tr" ? tr : enUS;

    if (isToday(date)) {
      return format(date, "HH:mm", { locale: dateLocale });
    } else if (isYesterday(date)) {
      return `${t("yesterday")} ${format(date, "HH:mm", { locale: dateLocale })}`;
    }
    return format(date, "dd MMM HH:mm", { locale: dateLocale });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = format(new Date(message.sentAt), "yyyy-MM-dd");
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const dateLocale = locale === "tr" ? tr : enUS;

    if (isToday(date)) {
      return t("today");
    } else if (isYesterday(date)) {
      return t("yesterday");
    }
    return format(date, "d MMMM yyyy", { locale: dateLocale });
  };

  if (isLoading) {
    return (
      <DashboardLayout title={t("title")}>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Card className="flex-1">
            <CardContent className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    i % 2 === 0 ? "justify-start" : "justify-end"
                  )}
                >
                  <Skeleton className="h-16 w-48 rounded-lg" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!conversation) {
    return (
      <DashboardLayout title={t("title")}>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t("fetchError")}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/messages">{t("title")}</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <DashboardLayout
      title={otherUser?.displayName || t("title")}
      description={conversation.subject}
    >
      <div className="flex flex-col h-[calc(100vh-14rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarFallback>{otherUser?.initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-medium">{otherUser?.displayName}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConnecting ? (
                <span>{t("connecting")}</span>
              ) : isConnected ? (
                <>
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  <span>{t("connected")}</span>
                </>
              ) : (
                <>
                  <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                  <span>{t("connectionError")}</span>
                </>
              )}
            </div>
          </div>

          {/* Product link */}
          {product && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/products/${product.slug}`}>
                <Package className="h-4 w-4 mr-2" />
                {t("product")}
              </Link>
            </Button>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">{t("noMessages")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messageGroups.map((group) => (
                  <div key={group.date}>
                    {/* Date header */}
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDateHeader(group.date)}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-3">
                      {group.messages.map((message) => {
                        const isOwnMessage = message.senderUserId === user?.id;

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isOwnMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-4 py-2",
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div
                                className={cn(
                                  "flex items-center gap-1 mt-1",
                                  isOwnMessage ? "justify-end" : "justify-start"
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-xs",
                                    isOwnMessage
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {formatMessageTime(message.sentAt)}
                                </span>
                                {isOwnMessage && (
                                  message.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                  ) : (
                                    <Check className="h-3 w-3 text-primary-foreground/70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <span className="text-sm text-muted-foreground italic">
                        {Array.from(typingUsers.values()).join(", ")} {t("typing")}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message input */}
        <div className="flex gap-2 mt-4">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={t("typeMessage")}
            disabled={isSending}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
