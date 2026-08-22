"use client";

import { useTheme } from "@/lib/theme/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      id="theme-toggle-btn"
      aria-label="Toggle Theme"
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
      className="p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 flex items-center justify-center shadow-sm"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-amber-200 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      )}
    </button>
  );
}
