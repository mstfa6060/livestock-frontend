"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Send, CheckCircle } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

export function ContactForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await (LivestockTradingAPI as any).ContactForms?.Create?.Request?.(form);
      if (response?.hasError) {
        setStatus("error");
      } else {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      }
    } catch {
      // Fallback: direct API call if generated client doesn't have ContactForms yet
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.livestock-trading.com"}/livestocktrading/ContactForms/Create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
        const data = await res.json();
        if (data.hasError) {
          setStatus("error");
        } else {
          setStatus("success");
          setForm({ name: "", email: "", subject: "", message: "" });
        }
      } catch {
        setStatus("error");
      }
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-medium text-green-700">{t("form.success")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-primary hover:underline"
        >
          {t("form.title")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">{t("form.name")}</label>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder={t("form.namePlaceholder")}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "contact-form-error" : undefined}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">{t("form.email")}</label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder={t("form.emailPlaceholder")}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "contact-form-error" : undefined}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1.5">{t("form.subject")}</label>
        <input
          id="subject"
          type="text"
          required
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder={t("form.subjectPlaceholder")}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "contact-form-error" : undefined}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1.5">{t("form.message")}</label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder={t("form.messagePlaceholder")}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "contact-form-error" : undefined}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      {status === "error" && (
        <p id="contact-form-error" className="text-sm text-red-600">{t("form.error")}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {status === "submitting" ? (
          <>{t("form.submitting")}</>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("form.submit")}
          </>
        )}
      </button>

      <div className="text-center pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-1">{t("info.title")}</p>
        <a
          href={`mailto:${t("info.emailValue")}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Mail className="h-4 w-4" />
          {t("info.emailValue")}
        </a>
      </div>
    </form>
  );
}
