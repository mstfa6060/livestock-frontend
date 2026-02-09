"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { IAMAPI } from "@/api/base_modules/iam";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Country {
  id: number;
  name: string;
  code: string;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, refreshUser } = useAuth();

  // Compute initial form data from user
  const initialFormData = useMemo(() => {
    if (!user) {
      return {
        firstName: "",
        surname: "",
        phoneNumber: "",
        countryId: 0,
        language: "tr",
        preferredCurrencyCode: "TRY",
      };
    }
    const nameParts = user.displayName?.split(" ") || [];
    return {
      firstName: nameParts[0] || "",
      surname: nameParts.slice(1).join(" ") || "",
      phoneNumber: "",
      countryId: user.countryId || 0,
      language: user.language || "tr",
      preferredCurrencyCode: user.currencyCode || "TRY",
    };
  }, [user]);

  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [formData, setFormData] = useState(initialFormData);

  // Sync form data when user data becomes available (initial load)
  useEffect(() => {
    if (user && formData.firstName === "" && formData.surname === "") {
      setFormData(initialFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await IAMAPI.Countries.All.Request({ keyword: "" });
        const countriesData = Array.isArray(response) ? response : [];
        setCountries(countriesData.map((c: { id: number; name: string; code: string }) => ({
          id: c.id,
          name: c.name,
          code: c.code,
        })));
      } catch {
        // Countries are optional
      }
    };
    fetchCountries();
  }, []);

  const initials = user
    ? user.displayName
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    : "?";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await IAMAPI.Users.Update.Request({
        userId: user.id,
        firstName: formData.firstName,
        surname: formData.surname,
        phoneNumber: formData.phoneNumber || undefined,
        countryId: formData.countryId || undefined,
        language: formData.language,
        preferredCurrencyCode: formData.preferredCurrencyCode,
      });

      await refreshUser();
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: "tr", name: "Turkce" },
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "fr", name: "Francais" },
    { code: "ar", name: "العربية" },
    { code: "ru", name: "Русский" },
  ];

  const currencies = [
    { code: "TRY", symbol: "₺", name: "Turk Lirasi" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
  ];

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                <p className="text-muted-foreground">@{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder={t("firstNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">{t("surname")}</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({ ...formData, surname: e.target.value })
                  }
                  placeholder={t("surnamePlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder={t("phonePlaceholder")}
                  className="flex-1"
                />
                {user?.isPhoneVerified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("phoneVerified")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {t("phoneNotVerified")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Select
                value={formData.countryId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, countryId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">{t("language")}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t("currency")}</Label>
                <Select
                  value={formData.preferredCurrencyCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferredCurrencyCode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCurrency")} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
