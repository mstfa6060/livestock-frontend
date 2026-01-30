"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const t = useTranslations("dashboardNav");
  const td = useTranslations("dashboard");
  const { user } = useAuth();

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.surname?.charAt(0) || ""}`
    : "?";

  return (
    <DashboardLayout title={t("profile")}>
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">
                {user?.firstName} {user?.surname}
              </h2>
              <p className="text-muted-foreground">@{user?.userName}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{td("email")}</p>
              <p className="font-medium">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{td("username")}</p>
              <p className="font-medium">{user?.userName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{td("id")}</p>
              <p className="font-medium text-xs">{user?.id || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
