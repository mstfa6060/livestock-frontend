"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { IAMAPI } from "@/api/base_modules/iam";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  participantUserId1: string;
  participantUserId2: string;
  productId?: string;
  subject: string;
  status: number;
  lastMessageAt?: string;
  createdAt: string;
  // Enriched data
  otherUserName?: string;
  otherUserInitials?: string;
  unreadCount?: number;
  lastMessage?: string;
}

export default function MessagesPage() {
  const t = useTranslations("messages");
  const locale = useLocale();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch conversations where user is a participant
        const response = await LivestockTradingAPI.Conversations.All.Request({
          sorting: {
            key: "lastMessageAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

        // Filter conversations where user is a participant
        const userConversations = response.filter(
          (conv) =>
            conv.participantUserId1 === user.id ||
            conv.participantUserId2 === user.id
        );

        // Enrich conversations with user data
        const enrichedConversations = await Promise.all(
          userConversations.map(async (conv) => {
            const otherUserId =
              conv.participantUserId1 === user.id
                ? conv.participantUserId2
                : conv.participantUserId1;

            let otherUserName = "Kullanici";
            let otherUserInitials = "?";

            try {
              const userDetail = await IAMAPI.Users.Detail.Request({
                userId: otherUserId,
              });
              if (userDetail) {
                otherUserName = userDetail.fullName || userDetail.userName || "Kullanici";
                otherUserInitials = otherUserName
                  .split(" ")
                  .map((n: string) => n.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
              }
            } catch {
              // User details not available
            }

            return {
              ...conv,
              lastMessageAt: conv.lastMessageAt?.toString(),
              createdAt: conv.createdAt.toString(),
              otherUserName,
              otherUserInitials,
              unreadCount: 0, // TODO: Calculate unread count from messages
            };
          })
        );

        setConversations(enrichedConversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id, t]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === "tr" ? tr : enUS,
    });
  };

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            {searchQuery ? "Sonuc bulunamadi" : t("noConversations")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("startConversation")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/messages/${conversation.id}`}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  conversation.unreadCount && conversation.unreadCount > 0
                    ? "border-primary/50 bg-primary/5"
                    : ""
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {conversation.otherUserInitials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator - placeholder */}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={cn(
                            "font-medium truncate",
                            conversation.unreadCount &&
                              conversation.unreadCount > 0
                              ? "font-semibold"
                              : ""
                          )}
                        >
                          {conversation.otherUserName}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(
                            conversation.lastMessageAt || conversation.createdAt
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.subject || "Yeni konusma"}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conversation.unreadCount &&
                      conversation.unreadCount > 0 && (
                        <Badge variant="default" className="rounded-full px-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
