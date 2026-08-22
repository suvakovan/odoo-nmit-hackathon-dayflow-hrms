"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, MailOpen, User } from "lucide-react";
import { notificationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

export default function Header() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.list(false);
      setNotifications(res.data);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch {
      toast.error("Failed to mark all read");
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch {
      toast.error("Failed to update notification");
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-primary text-white sticky top-0 z-20 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-outfit font-bold text-white text-sm border border-white/20">
          D
        </div>
        <div>
          <h2 className="text-white text-sm font-bold font-outfit tracking-wide leading-none">Dayflow Portal</h2>
          <span className="text-purple-200/70 text-[11px] font-medium uppercase tracking-wider leading-none">HR Management System</span>
        </div>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {/* User Info Pill */}
        {user && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-purple-100">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px] text-white">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-white leading-tight">{user.first_name || user.email.split("@")[0]}</span>
              <span className="text-[10px] text-purple-200/80 font-medium leading-tight">{user.role}</span>
            </div>
          </div>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notification Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="notification-bell-btn"
          aria-label="Notifications"
          className="p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 relative group shadow-sm"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              id="notification-count-badge"
              className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-primary animate-pulse"
            >
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            id="notification-dropdown"
            className="absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-y-auto rounded-2xl bg-surface border border-border shadow-2xl p-4 flex flex-col space-y-3 animate-fade-in text-text-primary z-30"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold font-outfit text-sm text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  id="mark-all-read-btn"
                  className="text-xs text-accent hover:underline font-medium flex items-center gap-1 transition-all"
                >
                  <MailOpen className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-xl border text-xs transition-all flex items-start gap-3",
                      notif.is_read
                        ? "bg-bg border-border text-text-secondary"
                        : "bg-accent/10 border-accent/20 text-text-primary font-medium"
                    )}
                  >
                    <p className="flex-1 leading-normal">{notif.message}</p>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 rounded bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
