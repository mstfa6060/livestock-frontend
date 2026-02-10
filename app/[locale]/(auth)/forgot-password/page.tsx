"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react";
import { IAMAPI } from "@/api/base_modules/iam";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const tc = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError("");

    try {
      await IAMAPI.Users.ForgotPassword.Request({
        email: data.email,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDefault"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
            <CardDescription>{t("successDescription")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={tc("emailPlaceholder")}
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:underline flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("backToLogin")}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
