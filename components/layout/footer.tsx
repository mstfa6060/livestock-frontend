"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-bold text-primary">
              LivestockTrading
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("company")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/sellers"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("sellers")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("products")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("support")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("faq")}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${t("supportEmail")}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("supportEmail")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("legal")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("contact")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("terms")}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// Simple footer for minimal pages
export function SimpleFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("contact")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("terms")}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
