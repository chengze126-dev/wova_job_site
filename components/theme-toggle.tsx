"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore private-mode quota errors
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch color theme"
      title="Switch light and dark"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[8px] transition ${
        onDark ? "text-white hover:bg-white/10" : "text-current hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="dark:hidden" />
    </button>
  );
}
