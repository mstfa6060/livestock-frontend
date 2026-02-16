"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth, getRememberedEmail } from "@/contexts/AuthContext";
import { loginFormSchema, type LoginFormData } from "@/lib/validations";
import { AppConfig } from "@/config/livestock-config";

// Google Client ID from config
const GOOGLE_CLIENT_ID = AppConfig.GoogleWebClientId;

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Apple Icon SVG
function AppleIcon() {
  return (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// Login form component that uses Google login hook
function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tc = useTranslations("common");
  const { login, loginWithSocial, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t("errorDefault");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login success
  const handleGoogleSuccess = useCallback(async (tokenResponse: { access_token: string }) => {
    setIsGoogleLoading(true);
    setError("");

    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );
      const userInfo = await userInfoResponse.json();

      // Login with social
      await loginWithSocial({
        provider: "google",
        token: tokenResponse.access_token,
        externalUserId: userInfo.sub,
        firstName: userInfo.given_name,
        surname: userInfo.family_name,
        email: userInfo.email,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t("socialLoginError");
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithSocial, t]);

  // Google login hook
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setError(t("socialLoginError"));
    },
  });

  // Apple Sign In - not yet implemented
  // Requires Apple Developer account setup and Apple JS SDK

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-950/50">
                {error}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => googleLogin()}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {t("continueWithGoogle")}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full opacity-50 cursor-not-allowed"
                disabled
                title={t("appleComingSoon")}
              >
                <AppleIcon />
                {t("continueWithApple")}
                <span className="ml-2 text-xs text-muted-foreground">({t("appleComingSoon")})</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("orContinueWith")}
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
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
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{tc("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("rememberMe")}
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("register")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Main page component wrapped with GoogleOAuthProvider
export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}
