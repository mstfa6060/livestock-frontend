"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { IAMAPI } from "@/api/base_modules/iam";

const PUSH_DISMISSED_KEY = "push-permission-dismissed";
const DEVICE_ID_KEY = "push-device-id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function PushPermission() {
  const t = useTranslations("pushPermission");
  const { user, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    // Already granted or denied at browser level
    if (Notification.permission !== "default") return;

    // User dismissed the banner before
    if (localStorage.getItem(PUSH_DISMISSED_KEY) === "true") return;

    setVisible(true);
  }, [isAuthenticated, user]);

  const registerPushToken = useCallback(
    async (subscription: PushSubscription) => {
      if (!user) return;
      try {
        await IAMAPI.Push.RegisterToken.Request({
          userId: user.id,
          pushToken: JSON.stringify(subscription.toJSON()),
          deviceId: getOrCreateDeviceId(),
          appName: "web",
          platform: IAMAPI.Enums.UserPushPlatform.WebPush,
        });
      } catch (err) {
        console.error("Failed to register push token:", err);
      }
    },
    [user]
  );

  const handleAllow = useCallback(async () => {
    setVisible(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // VAPID public key would go here in production:
        // applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await registerPushToken(subscription);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }, [registerPushToken]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(PUSH_DISMISSED_KEY, "true");
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bell className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("description")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleAllow}>
          {t("allow")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDismiss}
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
