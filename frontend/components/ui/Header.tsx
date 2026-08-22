"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, MailOpen } from "lucide-react";
import { notificationApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.list(false);
      setNotifications(res.data);
    } catch {
      // Silently fail to avoid console noise during token expiration
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
    } catch (err: any) {
      toast.error("Failed to mark all read");
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch (err: any) {
      toast.error("Failed to update notification");
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-20">
      <div>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Workspace</span>
        <h2 className="text-white text-sm font-bold font-outfit mt-0.5">Dayflow Portal</h2>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="notification-bell-btn"
          className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-200 relative group"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              id="notification-count-badge"
              className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse"
            >
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            id="notification-dropdown"
            className="absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-y-auto rounded-2xl glass-card border border-border shadow-2xl p-4 flex flex-col space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-white font-bold font-outfit text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  id="mark-all-read-btn"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-all"
                >
                  <MailOpen className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-xl border text-xs transition-all flex items-start gap-3",
                      notif.is_read
                        ? "bg-slate-950/20 border-slate-900/40 text-slate-500"
                        : "bg-indigo-500/5 border-indigo-500/10 text-slate-200"
                    )}
                  >
                    <p className="flex-1 leading-normal">{notif.message}</p>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex-shrink-0"
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
