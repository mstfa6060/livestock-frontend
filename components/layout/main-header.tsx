"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, LayoutDashboard, Menu } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CountrySwitcher } from "./country-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function MainHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">
            LivestockTrading
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {t("products")}
          </Link>
          <Link
            href="/sellers"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {t("sellers")}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {t("about")}
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Country & Language Switchers - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <CountrySwitcher />
            <LanguageSwitcher />
          </div>

          {/* Auth Buttons */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{user.displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t("dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{tc("login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{tc("register")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/products"
                  className="text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("products")}
                </Link>
                <Link
                  href="/sellers"
                  className="text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("sellers")}
                </Link>
                <Link
                  href="/about"
                  className="text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("about")}
                </Link>

                <div className="border-t pt-4 mt-4">
                  <div className="flex flex-col gap-2">
                    <CountrySwitcher />
                    <LanguageSwitcher />
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                    <Button asChild>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tc("login")}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tc("register")}
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
