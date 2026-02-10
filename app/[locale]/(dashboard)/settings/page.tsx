"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { IAMAPI } from "@/api/base_modules/iam";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tp = useTranslations("settings.updatePassword");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError(tp("passwordMismatch"));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(tp("passwordTooShort"));
      return;
    }

    if (!user) {
      setError(tp("sessionError"));
      return;
    }

    setIsLoading(true);

    try {
      await IAMAPI.Users.UpdatePassword.Request({
        userId: user.id,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : tp("errorDefault"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={t("title")}>
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{tp("title")}</CardTitle>
            <CardDescription>{tp("description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {tp("success")}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">{tp("currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.oldPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, oldPassword: e.target.value })
                    }
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{tp("newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{tp("confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tp("submitting")}
                  </>
                ) : (
                  tp("submit")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
