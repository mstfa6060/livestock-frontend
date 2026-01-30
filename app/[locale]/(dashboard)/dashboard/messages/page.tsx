"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const t = useTranslations("dashboardNav");
  const td = useTranslations("dashboard");

  return (
    <DashboardLayout title={t("messages")}>
      <div className="text-center py-16">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">{td("noMessages")}</p>
      </div>
    </DashboardLayout>
  );
}
