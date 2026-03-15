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
import { User, LogOut, Settings, LayoutDashboard, Menu, Search, Plus } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CountrySwitcher } from "./country-switcher";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function MainHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const createListingHref = isAuthenticated ? "/dashboard/listings/new" : "/login";

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
      {/* Brand Accent Line */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />

      {/* Top Utility Bar */}
      <div className="bg-muted/60 border-b">
        <div className="container flex h-9 items-center justify-between text-xs">
          <div className="hidden sm:flex items-center gap-4">
            <CountrySwitcher />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {isAuthenticated && user && (
              <NotificationBell />
            )}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs">
                    <User className="h-3.5 w-3.5 mr-1.5" />
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-7 text-xs" asChild>
                  <Link href="/login">{tc("login")}</Link>
                </Button>
                <Button size="sm" className="h-7 text-xs" asChild>
                  <Link href="/register">{tc("register")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-muted/40 backdrop-blur-xl border-b shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">LT</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-foreground">
                Livestock<span className="text-primary">Trading</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            <Link
              href="/products"
              className="px-4 py-2 text-sm font-medium text-foreground/65 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("products")}
            </Link>
            <Link
              href="/sellers"
              className="px-4 py-2 text-sm font-medium text-foreground/65 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("sellers")}
            </Link>
            <Link
              href="/transporters"
              className="px-4 py-2 text-sm font-medium text-foreground/65 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("transporters")}
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-sm font-medium text-foreground/65 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("about")}
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-foreground/65 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("pricing")}
            </Link>
          </nav>

          {/* Create Listing + Search + Mobile Menu */}
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="hidden md:flex shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={createListingHref} className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                {t("createListing")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="hidden md:flex shadow-none">
              <Link href="/search" className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                {t("search")}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label={t("menu")}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button size="lg" asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                    <Link
                      href={createListingHref}
                      className="flex items-center justify-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Plus className="h-5 w-5" />
                      {t("createListing")}
                    </Link>
                  </Button>
                  <div className="border-b" />
                  <Link
                    href="/search"
                    className="text-lg font-medium flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="h-5 w-5" />
                    {t("search")}
                  </Link>
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
                    href="/transporters"
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("transporters")}
                  </Link>
                  <Link
                    href="/about"
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("about")}
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("pricing")}
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
      </div>
    </header>

      {/* Mobile Floating Action Button - visible on public pages only */}
      {!isDashboard && (
        <Link
          href={createListingHref}
          className="fixed bottom-6 right-6 z-50 md:hidden flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all duration-200"
          aria-label={t("createListing")}
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </>
  );
}
