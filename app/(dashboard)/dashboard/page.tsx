"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
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
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Çıkış Yap
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoş geldiniz, {user.displayName}!</CardTitle>
            <CardDescription>
              Hesap bilgileriniz aşağıda görüntülenmektedir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Kullanıcı Adı:</strong> {user.username}</p>
            <p><strong>E-posta:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
