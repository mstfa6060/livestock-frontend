"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export function ErrorDisplay({
  error,
  reset,
  showHomeButton = true,
  showBackButton = false,
}: ErrorDisplayProps) {
  const t = useTranslations("error");
  const locale = useLocale();

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {t("description")}
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-1">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("retry")}
            </Button>

            {showBackButton && (
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("goBack")}
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = locale === "en" ? "/" : `/${locale}`)}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                {t("goHome")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
