"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: only reflect the resolved theme after mount.
  useEffect(() => setMounted(true), []);

  const isDay = resolvedTheme === "day";
  const label = isDay ? "Switch to night mode" : "Switch to day mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted hover:text-foreground hover:border-accent/30 transition-all"
    >
      {mounted && isDay ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
