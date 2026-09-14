"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "glowup_theme";

/**
 * Theme values:
 *  - "system": follow the device / OS preference (default)
 *  - "day":    force the light theme
 *  - "night":  force the dark theme (the original Cold Luxury look)
 */
const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "night",
  setTheme: () => {},
  toggleTheme: () => {},
});

function getSystemTheme() {
  if (typeof window === "undefined") return "night";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "day"
    : "night";
}

function resolve(theme) {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved === "day" ? "light" : "dark";

  // Keep the browser UI (mobile status bar) in sync.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "day" ? "#f7f5f0" : "#0a0a0f");
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("night");

  // Initialise from storage (falls back to system) on mount.
  useEffect(() => {
    let stored;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const initial =
      stored === "day" || stored === "night" || stored === "system"
        ? stored
        : "system";
    setThemeState(initial);
    const r = resolve(initial);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  // React to OS theme changes while in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const r = getSystemTheme();
      setResolvedTheme(r);
      applyTheme(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    const r = resolve(next);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  // Toggle between the two explicit themes based on what's showing now.
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "day" ? "night" : "day");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
