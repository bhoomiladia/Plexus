// app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import { useColorTheme, colorThemes } from "@/hooks/useColorTheme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorTheme } = useColorTheme();
  const theme = colorThemes[colorTheme];

  return (
    <div
      className="min-h-screen text-[#F0F4F2] font-sans selection:bg-[var(--theme-accent)]/30 transition-colors duration-300"
      style={{ backgroundColor: theme.background }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}