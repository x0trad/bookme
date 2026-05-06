"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl transition-colors hover:bg-[var(--bg-muted)] ${className}`}
    >
      {theme === "dark" ? (
        <Sun size={18} style={{ color: "var(--text-muted)" }} />
      ) : (
        <Moon size={18} style={{ color: "var(--text-muted)" }} />
      )}
    </button>
  );
}
