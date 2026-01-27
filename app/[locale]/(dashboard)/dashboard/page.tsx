"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{tc("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              {t("logout")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("welcome", { name: user.displayName })}</CardTitle>
            <CardDescription>{t("accountInfo")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>{t("username")}:</strong> {user.username}</p>
            <p><strong>{t("email")}:</strong> {user.email}</p>
            <p><strong>{t("id")}:</strong> {user.id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
