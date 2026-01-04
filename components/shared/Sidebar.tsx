"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PlusSquare,
  MessageSquare,
  Users,
  Trophy,
  Settings,
  FolderKanban,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckSquare,
  Award,
} from "lucide-react";
import { useColorTheme, colorThemes } from "@/hooks/useColorTheme";
import ColorThemePicker from "@/components/ColorThemePicker";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Certificates", href: "/dashboard/certificates", icon: Award },
  {
    name: "Create Project",
    href: "/dashboard/projects/create",
    icon: PlusSquare,
  },
  {
    name: "My Projects",
    href: "/dashboard/projects/manage",
    icon: FolderKanban,
  },
  { name: "Chats", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Showcase", href: "/dashboard/public-gallery", icon: Trophy },
  { name: "My Profile", href: "/dashboard/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colorTheme } = useColorTheme();
  const theme = colorThemes[colorTheme];

  return (
    <aside
      className={`h-[calc(100vh-40px)] m-5 rounded-[2.5rem] flex flex-col fixed left-0 top-0 overflow-hidden shadow-2xl z-50 transition-all duration-500 ease-in-out ${
        isCollapsed ? "w-20" : "w-72"
      }`}
      style={{ backgroundColor: theme.sidebar }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-10 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#F0F4F2] hover:scale-110 transition-all shadow-lg z-[60]"
        style={{ backgroundColor: theme.accent }}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Header Updated to UNIRIVO */}
      <div
        className={`p-10 pb-10 transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"}`}
      >
        <h1
          className="text-3xl font-black tracking-tighter uppercase whitespace-nowrap"
          style={{ color: theme.accent }}
        >
          UNIRIVO
        </h1>
      </div>

      {/* Navigation - Added 'overflow-hidden' and flex-grow to prevent scroll */}
      <nav className="flex-grow px-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                isCollapsed ? "px-0 justify-center" : "px-6"
              } ${
                isActive
                  ? "text-[#F0F4F2] shadow-md"
                  : "text-[#F0F4F2]/50 hover:bg-white/5 hover:text-[#F0F4F2]"
              }`}
              style={isActive ? { backgroundColor: theme.accent } : undefined}
            >
              <item.icon
                size={20}
                className="shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings, Theme Picker and Logout at Bottom */}
      <div className="p-3 mb-5 border-t border-white/5 space-y-1">
        <ColorThemePicker isCollapsed={isCollapsed} />
        
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 py-4 text-sm font-bold rounded-2xl transition-all ${
            isCollapsed ? "px-0 justify-center" : "px-6"
          } ${
            pathname === "/dashboard/settings"
              ? "text-[#F0F4F2]"
              : "text-[#F0F4F2]/50 hover:bg-white/5"
          }`}
          style={pathname === "/dashboard/settings" ? { backgroundColor: theme.accent } : undefined}
        >
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`w-full flex items-center gap-3 py-4 text-sm font-bold rounded-2xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 ${
            isCollapsed ? "px-0 justify-center" : "px-6"
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
