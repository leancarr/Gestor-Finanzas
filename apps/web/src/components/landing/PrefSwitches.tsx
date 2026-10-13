'use client';

import { Moon, Sun } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export function PrefSwitches({ className }: { className?: string }) {
  const { lang, setLang, theme, setTheme, t } = usePrefs();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div role="radiogroup" aria-label={t.prefs.language} className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
        {(["es", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            onClick={() => setLang(l)}
            className={cn(
              "min-h-10 min-w-10 rounded-full px-2.5 uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
              lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? t.prefs.toLight : t.prefs.toDark}
        className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-medium border-border text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="hidden xl:inline">{theme === "dark" ? (lang === "es" ? "Oscuro" : "Dark") : (lang === "es" ? "Claro" : "Light")}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {theme === "dark" ? t.prefs.darkOn : t.prefs.lightOn}, {lang === "es" ? "Español" : "English"}
      </span>
    </div>
  );
}
