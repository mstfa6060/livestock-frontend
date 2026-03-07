"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { IAMAPI } from "@/api/base_modules/iam";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface Preferences {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  darkModeEnabled: boolean;
  preferredCurrency: string;
  preferredLanguage: string;
  countryCode: string;
  timeZone: string;
  weightSystem: number;
  distanceSystem: number;
  areaSystem: number;
  productsPerPage: number;
  defaultViewMode: number;
}

const defaultPrefs: Preferences = {
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  pushNotificationsEnabled: true,
  darkModeEnabled: false,
  preferredCurrency: "TRY",
  preferredLanguage: "tr",
  countryCode: "TR",
  timeZone: "Europe/Istanbul",
  weightSystem: 0,
  distanceSystem: 0,
  areaSystem: 0,
  productsPerPage: 20,
  defaultViewMode: 0,
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tp = useTranslations("settings.updatePassword");
  const tpref = useTranslations("settings.preferences");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Password form state (mutations stay local)
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

  // Preferences via React Query
  const { data: prefs = defaultPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: queryKeys.preferences.my(user?.id ?? ""),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Preferences.My.Request({
        userId: user!.id,
      });

      return {
        emailNotificationsEnabled: response.emailNotificationsEnabled,
        smsNotificationsEnabled: response.smsNotificationsEnabled,
        pushNotificationsEnabled: response.pushNotificationsEnabled,
        darkModeEnabled: response.darkModeEnabled,
        preferredCurrency: response.preferredCurrency,
        preferredLanguage: response.preferredLanguage,
        countryCode: response.countryCode,
        timeZone: response.timeZone,
        weightSystem: response.weightSystem,
        distanceSystem: response.distanceSystem,
        areaSystem: response.areaSystem,
        productsPerPage: response.productsPerPage,
        defaultViewMode: response.defaultViewMode,
      } satisfies Preferences;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Local editable copy of prefs for toggles
  const [localPrefs, setLocalPrefs] = useState<Preferences | null>(null);
  const editablePrefs = localPrefs ?? prefs;

  // Sync local prefs when query data changes (only if not already editing)
  const updatePref = (key: keyof Preferences, value: boolean) => {
    setLocalPrefs((prev) => ({ ...(prev ?? prefs), [key]: value }));
  };

  const [prefsSaving, setPrefsSaving] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  const handlePreferencesSave = async () => {
    if (!user?.id) return;

    setPrefsSaving(true);
    try {
      await LivestockTradingAPI.Preferences.Update.Request({
        userId: user.id,
        ...editablePrefs,
      });
      // Invalidate the query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.preferences.my(user.id),
      });
      setLocalPrefs(null);
      toast.success(tpref("saveSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tpref("saveError"));
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <DashboardLayout title={t("title")}>
      <div className="max-w-2xl space-y-6">
        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tp("title")}</CardTitle>
            <CardDescription>{tp("description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
                    aria-label={showOldPassword ? tp("hidePassword") : tp("showPassword")}
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
                    aria-label={showNewPassword ? tp("hidePassword") : tp("showPassword")}
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
                    aria-label={showConfirmPassword ? tp("hidePassword") : tp("showPassword")}
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

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tpref("title")}</CardTitle>
            <CardDescription>{tpref("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prefsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Notification Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-4">{tpref("notifications")}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{tpref("emailNotifications")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {tpref("emailNotificationsDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={editablePrefs.emailNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          updatePref("emailNotificationsEnabled", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{tpref("smsNotifications")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {tpref("smsNotificationsDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={editablePrefs.smsNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          updatePref("smsNotificationsEnabled", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{tpref("pushNotifications")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {tpref("pushNotificationsDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={editablePrefs.pushNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          updatePref("pushNotificationsEnabled", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Appearance */}
                <div>
                  <h3 className="text-sm font-medium mb-4">{tpref("appearance")}</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{tpref("darkMode")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {tpref("darkModeDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={editablePrefs.darkModeEnabled}
                      onCheckedChange={(checked) =>
                        updatePref("darkModeEnabled", checked)
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePreferencesSave}
              disabled={prefsSaving || prefsLoading}
            >
              {prefsSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tpref("saving")}
                </>
              ) : (
                tpref("saveChanges")
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
