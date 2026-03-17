"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ChevronDown, Search, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/queries";

interface Country {
  id: number;
  code: string;
  code3: string;
  name: string;
  nativeName: string;
  phoneCode: string;
  defaultCurrencyCode: string;
  defaultCurrencySymbol: string;
}

const STORAGE_KEY = "selectedCountry";

export function CountrySwitcher() {
  const t = useTranslations("header");
  const { user } = useAuth();
  const { data: countries = [], isLoading } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Select country based on saved preference, user profile, or default to Turkey
  useEffect(() => {
    if (countries.length === 0) return;

    // Try to restore saved country
    const savedCountry = localStorage.getItem(STORAGE_KEY);
    if (savedCountry) {
      try {
        const parsed = JSON.parse(savedCountry) as Country;
        const found = countries.find((c: Country) => c.id === parsed.id);
        if (found) {
          setSelectedCountry(found);
          return;
        }
      } catch {
        // Invalid saved country
      }
    }

    // Use user's country if logged in
    if (user?.countryId) {
      const userCountry = countries.find((c: Country) => c.id === user.countryId);
      if (userCountry) {
        setSelectedCountry(userCountry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userCountry));
        return;
      }
    }

    // Default to Turkey
    const turkey = countries.find((c: Country) => c.code === "TR");
    if (turkey) {
      setSelectedCountry(turkey);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(turkey));
    }
  }, [countries, user?.countryId]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(country));
    window.dispatchEvent(
      new CustomEvent("countryChange", { detail: country })
    );
    setOpen(false);
    setSearch("");
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
        <MapPin className="h-3.5 w-3.5 mr-1.5" />
        ...
      </Button>
    );
  }

  const lowerSearch = search.toLowerCase();
  const filteredCountries = countries.filter(
    (c: Country) =>
      c.name.toLowerCase().includes(lowerSearch) ||
      c.nativeName.toLowerCase().includes(lowerSearch) ||
      c.code.toLowerCase().includes(lowerSearch) ||
      c.defaultCurrencyCode.toLowerCase().includes(lowerSearch)
  );

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>{selectedCountry?.nativeName || selectedCountry?.name || "Select"}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("searchCountry")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredCountries.map((country: Country) => (
            <DropdownMenuItem
              key={country.id}
              onClick={() => handleCountryChange(country)}
              className={selectedCountry?.id === country.id ? "bg-accent" : ""}
            >
              <span className="flex-1 truncate">{country.nativeName || country.name}</span>
              <span className="text-muted-foreground text-xs ml-2 shrink-0">
                {country.defaultCurrencySymbol} {country.code}
              </span>
              {selectedCountry?.id === country.id && (
                <Check className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          {filteredCountries.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t("noResults")}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook to get selected country
export function useSelectedCountry() {
  const [country, setCountry] = useState<Country | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) as Country;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    const handleChange = (e: CustomEvent<Country>) => {
      setCountry(e.detail);
    };

    window.addEventListener("countryChange", handleChange as EventListener);
    return () => {
      window.removeEventListener("countryChange", handleChange as EventListener);
    };
  }, []);

  return country;
}
