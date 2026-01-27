"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Livestock Trading
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost">{t("auth.login.title")}</Button>
            </Link>
            <Link href="/register">
              <Button>{t("auth.register.title")}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Livestock Trading Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The most trusted live animal trading platform. Buy and sell cattle
            and sheep safely.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/register">
              <Button size="lg">{t("auth.register.title")}</Button>
            </Link>
            <Link href="/animals">
              <Button variant="outline" size="lg">
                View Listings
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Secure Shopping</h3>
            <p className="mt-2 text-muted-foreground">
              All transactions are protected. Seller and buyer information is verified.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Wide Product Range</h3>
            <p className="mt-2 text-muted-foreground">
              Cattle, sheep and more. Easily find the animal you are looking for.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">24/7 Support</h3>
            <p className="mt-2 text-muted-foreground">
              We are always here for your questions. Our live support line is active.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Livestock Trading. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
