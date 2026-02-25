"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown } from "lucide-react";
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
  const { user } = useAuth();
  const { data: countries = [], isLoading } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

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
    // Dispatch event for other components to listen
    window.dispatchEvent(
      new CustomEvent("countryChange", { detail: country })
    );
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <MapPin className="h-4 w-4 mr-2" />
        ...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MapPin className="h-4 w-4 mr-2" />
          {selectedCountry?.nativeName || selectedCountry?.name || "Select"}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto w-56">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.id}
            onClick={() => handleCountryChange(country)}
            className={selectedCountry?.id === country.id ? "bg-accent" : ""}
          >
            <span className="flex-1">{country.nativeName || country.name}</span>
            <span className="text-muted-foreground text-xs ml-2">
              {country.defaultCurrencySymbol}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook to get selected country
export function useSelectedCountry() {
  const [country, setCountry] = useState<Country | null>(() => {
    // Load from storage during initialization
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
    // Listen for changes only
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
