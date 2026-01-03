"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Briefcase,
  ExternalLink,
  Clock,
  Loader2,
  UserPlus,
  UserMinus,
  MessageSquare,
  FileEdit,
  Trash2,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    projectId?: string;
    applicationId?: string;
    chatId?: string;
  };
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session, filter]);

  const fetchNotifications = async () => {
    try {
      const url =
        filter === "unread"
          ? "/api/notifications?unreadOnly=true"
          : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "APPLICATION_ACCEPTED":
        return <CheckCircle2 size={24} className="text-green-500" />;
      case "APPLICATION_REJECTED":
        return <XCircle size={24} className="text-red-500" />;
      case "APPLICATION_SHORTLISTED":
        return <Briefcase size={24} className="text-yellow-500" />;
      case "NEW_APPLICATION":
        return <Briefcase size={24} className="text-[#88AB8E]" />;
      case "MEMBER_ADDED":
        return <UserPlus size={24} className="text-blue-500" />;
      case "MEMBER_REMOVED":
        return <UserMinus size={24} className="text-orange-500" />;
      case "PROJECT_UPDATED":
        return <FileEdit size={24} className="text-purple-500" />;
      case "NEW_MESSAGE":
        return <MessageSquare size={24} className="text-[#88AB8E]" />;
      default:
        return <Bell size={24} className="text-[#88AB8E]" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "APPLICATION_ACCEPTED":
        return "border-green-500/30 bg-green-500/5";
      case "APPLICATION_REJECTED":
        return "border-red-500/30 bg-red-500/5";
      case "APPLICATION_SHORTLISTED":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "NEW_APPLICATION":
        return "border-[#88AB8E]/30 bg-[#88AB8E]/5";
      case "MEMBER_ADDED":
        return "border-blue-500/30 bg-blue-500/5";
      case "MEMBER_REMOVED":
        return "border-orange-500/30 bg-orange-500/5";
      case "PROJECT_UPDATED":
        return "border-purple-500/30 bg-purple-500/5";
      case "NEW_MESSAGE":
        return "border-[#88AB8E]/30 bg-[#88AB8E]/5";
      default:
        return "border-white/5";
    }
  };

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] flex items-center justify-center border border-white/5">
        <Loader2 className="animate-spin h-12 w-12 text-[#88AB8E]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-10"
      >
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-[#3E5C58] rounded-[2rem] text-[#88AB8E] shadow-xl border border-white/5 relative">
              <Bell size={36} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                Notifications
              </h1>
              <p className="text-[#88AB8E] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
                System Intel // {unreadCount} Unread
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all bg-[#243131] text-[#88AB8E] border border-white/5 hover:bg-[#88AB8E] hover:text-[#141C1C]"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === "all"
                  ? "bg-[#88AB8E] text-[#141C1C]"
                  : "bg-[#243131] text-[#88AB8E] border border-white/5"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === "unread"
                  ? "bg-[#88AB8E] text-[#141C1C]"
                  : "bg-[#243131] text-[#88AB8E] border border-white/5"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-[#243131]/30 rounded-[3.5rem] border border-dashed border-white/10"
            >
              <div className="bg-[#1A2323] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                <Bell className="text-[#F0F4F2]/10" size={40} />
              </div>
              <h3 className="text-2xl font-black   uppercase text-[#F0F4F2]/40 tracking-widest mb-4">
                {filter === "unread" ? "All Caught Up" : "Zero Inbound Signals"}
              </h3>
              <p className="text-[#88AB8E]/30 font-bold uppercase tracking-[0.2em] text-[10px] max-w-xs mx-auto mb-10">
                {filter === "unread"
                  ? "No unread notifications. You're all set!"
                  : "Queue empty. Standby for new transmissions."}
              </p>
              <Link
                href="/dashboard/projects"
                className="bg-[#88AB8E] text-[#141C1C] px-10 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
              >
                Browse Projects
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 50 }}
                  className={`bg-[#243131] p-8 rounded-[3rem] border shadow-lg flex items-start gap-6 group transition-all hover:border-[#88AB8E]/50 ${getNotificationColor(
                    notification.type
                  )} ${!notification.read ? "border-l-4 border-l-[#88AB8E]" : ""}`}
                >
                  {/* Icon */}
                  <div className="w-16 h-16 bg-[#1A2323] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-tight">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="px-3 py-1 bg-[#88AB8E] text-[#141C1C] text-[8px] font-black rounded-full uppercase">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-[#F0F4F2]/60 text-sm leading-relaxed mb-4">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[#88AB8E]/40 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} />{" "}
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>

                      {notification.link && (
                        <span className="text-[#88AB8E] text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                          View Details <ExternalLink size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        className="p-2 bg-[#1A2323] rounded-xl text-[#88AB8E] hover:bg-[#88AB8E] hover:text-[#141C1C] transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="p-2 bg-[#1A2323] rounded-xl text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
