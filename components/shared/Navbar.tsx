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
        {/* <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3E5C58]/60" size={18} />
        <input 
          type="text"
          placeholder="Search projects or skills..."
          className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-[#88AB8E] outline-none transition-all text-[#3E5C58]"
        /> */}
      </div>

      <div className="flex items-center gap-4">
        {/* Action Button */}
        <Link href="/dashboard/projects/create" className="bg-[#2D4340] text-[#F0F4F2] hover:bg-[#3E5C58] px-8 py-3 rounded-2xl font-bold text-sm transition-colors shadow-sm">
          New Project
        </Link>

        {/* Notifications */}
        <Link href='/dashboard/notifications' className="p-3 bg-white rounded-2xl shadow-sm relative text-[#3E5C58] hover:bg-gray-50 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-5 h-5 bg-[#88AB8E] text-[#F0F4F2] text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </Link>

        {/* Profile Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#3E5C58] flex items-center justify-center text-[#88AB8E] shadow-lg border border-white/10">
          <User size={24} strokeWidth={2.5} />
        </div>
      </div>
    </header>
  );
}