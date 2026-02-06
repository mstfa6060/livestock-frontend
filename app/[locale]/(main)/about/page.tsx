"use client";

import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, Lightbulb, Users, Store, Package, CheckCircle } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("about");

  const stats = [
    { label: t("stats.users"), value: "50,000+", icon: Users },
    { label: t("stats.sellers"), value: "5,000+", icon: Store },
    { label: t("stats.products"), value: "25,000+", icon: Package },
    { label: t("stats.transactions"), value: "100,000+", icon: CheckCircle },
  ];

  const values = [
    {
      key: "trust",
      icon: Shield,
      title: t("values.trust.title"),
      description: t("values.trust.description"),
    },
    {
      key: "quality",
      icon: Award,
      title: t("values.quality.title"),
      description: t("values.quality.description"),
    },
    {
      key: "innovation",
      icon: Lightbulb,
      title: t("values.innovation.title"),
      description: t("values.innovation.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 mx-auto text-primary mb-3" />
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">{t("mission.title")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("mission.description")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">{t("vision.title")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("vision.description")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("values.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => (
                <Card key={value.key}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SimpleFooter />
    </div>
  );
}
