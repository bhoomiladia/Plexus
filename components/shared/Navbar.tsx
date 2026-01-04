"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="h-24 bg-transparent top-0 z-40 px-10 flex items-center justify-between overflow-hidden transition-all duration-300">
      {/* Search Bar */}
      <div className="relative w-96 hidden md:block">
        {/* <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]/60" size={18} />
        <input 
          type="text"
          placeholder="Search projects or skills..."
          className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all text-[var(--theme-muted)]"
        /> */}
      </div>

      <div className="flex items-center gap-4">
        {/* Action Button */}
        <Link href="/dashboard/projects/create" className="bg-[var(--theme-button-bg)] text-[#F0F4F2] hover:bg-[var(--theme-muted)] px-8 py-3 rounded-2xl font-bold text-sm transition-colors shadow-sm">
          New Project
        </Link>

        {/* Notifications */}
        <Link href='/dashboard/notifications' className="p-3 bg-white rounded-2xl shadow-sm relative text-[var(--theme-muted)] hover:bg-gray-50 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-5 h-5 bg-[var(--theme-accent)] text-[#F0F4F2] text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </Link>

        {/* Profile Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[var(--theme-muted)] flex items-center justify-center text-[var(--theme-accent)] shadow-lg border border-white/10">
          <User size={24} strokeWidth={2.5} />
        </div>
      </div>
    </header>
  );
}
