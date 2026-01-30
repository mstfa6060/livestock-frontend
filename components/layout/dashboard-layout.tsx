"use client";

import { ReactNode } from "react";
import { MainHeader } from "./main-header";
import { DashboardSidebar, DashboardMobileNav } from "./dashboard-sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <MainHeader />

        <div className="flex flex-1">
          <DashboardSidebar />

          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
            {(title || description) && (
              <div className="mb-6">
                {title && <h1 className="text-2xl font-bold">{title}</h1>}
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}
            {children}
          </main>
        </div>

        <DashboardMobileNav />
      </div>
    </ProtectedRoute>
  );
}
