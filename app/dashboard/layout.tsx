// app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141C1C] text-[#F0F4F2] font-sans selection:bg-[#88AB8E]/30">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}