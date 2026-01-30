"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("dashboardNav");
  const td = useTranslations("dashboard");

  return (
    <DashboardLayout title={t("notifications")}>
      <div className="text-center py-16">
        <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">{td("noNotifications")}</p>
      </div>
    </DashboardLayout>
  );
}
