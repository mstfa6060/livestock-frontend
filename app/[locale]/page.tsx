"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainHeader } from "@/components/layout/main-header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Layers, Headphones, ArrowRight } from "lucide-react";
import { HomepageBanners } from "@/components/features/homepage-banners";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/products">{t("hero.viewListings")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Banners */}
        <HomepageBanners />

        {/* Categories */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">
              {t("categories.title")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "cattle", icon: "🐄" },
                { key: "sheep", icon: "🐑" },
                { key: "poultry", icon: "🐔" },
                { key: "other", icon: "🐴" },
              ].map((category) => (
                <Link key={category.key} href={`/products?category=${category.key}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <span className="text-4xl mb-2">{category.icon}</span>
                      <span className="font-medium">
                        {t(`categories.${category.key}`)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("features.secure.title")}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t("features.secure.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("features.variety.title")}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t("features.variety.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <Headphones className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("features.support.title")}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t("features.support.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
