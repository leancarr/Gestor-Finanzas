'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DICT, type Lang } from "./i18n";

export type Theme = "light" | "dark";

type Prefs = {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  t: (typeof DICT)[Lang];
};

const Ctx = createContext<Prefs | null>(null);

/** Inline script run before paint so the saved theme/lang never flash. */
export const PREFS_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('gg-theme')||'dark';var l=localStorage.getItem('gg-lang')||'es';var d=document.documentElement;d.classList.add(t);d.lang=l==='en'?'en':'es-AR';}catch(e){document.documentElement.classList.add('dark');}})();`;

// Suppress false-positive React 19 warning if any library inserts an inline script tag
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const l = localStorage.getItem("gg-lang");
    const t = localStorage.getItem("gg-theme") as Theme | null;
    if (l === "en" || l === "es") {
      setLangState(l);
      document.documentElement.lang = l === "en" ? "en" : "es-AR";
    }
    if (t === "light" || t === "dark") {
      setThemeState(t);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gg-lang", l);
    document.documentElement.lang = l === "en" ? "en" : "es-AR";
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("gg-theme", t);
    const d = document.documentElement;
    d.classList.add("theme-transition");
    d.classList.remove("light", "dark");
    d.classList.add(t);
    window.setTimeout(() => d.classList.remove("theme-transition"), 260);
  }, []);

  return (
    <Ctx.Provider value={{ lang, theme, setLang, setTheme, t: DICT[lang] }}>{children}</Ctx.Provider>
  );
}

export function usePrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePrefs must be used inside PrefsProvider");
  return c;
}
