'use client';

import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CloudOff, Download, Globe, Landmark, Menu, Moon, RefreshCw, Sun, Trash2, X } from "lucide-react";
import { parseMagicInput } from "@/lib/finance";
import { usePrefs, PrefsProvider } from "@/lib/prefs";
import { PrefSwitches } from "@/components/landing/PrefSwitches";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="money text-xs uppercase text-muted-foreground">{children}</p>;
}

function SampleTag({ children }: { children: ReactNode }) {
  return <span className="money rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

/* Compact one-tap language + theme buttons for the mobile header (< sm). */
function MobilePrefs() {
  const { lang, setLang, theme, setTheme, t } = usePrefs();
  const btn = "grid size-11 place-items-center rounded-full border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer";
  return (
    <div className="flex items-center gap-1.5 sm:hidden">
      <button onClick={() => setLang(lang === "es" ? "en" : "es")} aria-label={`${t.prefs.language}: ${lang === "es" ? "Español" : "English"}`} className={cn(btn, "money relative text-[10px] font-semibold")}>
        <Globe className="size-4" />
        <span className="absolute -bottom-0.5 rounded-full bg-primary px-1 text-[9px] uppercase leading-3 text-primary-foreground">{lang}</span>
      </button>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t.prefs.toLight : t.prefs.toDark} className={btn}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </div>
  );
}

/* Shared dash pagination: one component, one interaction pattern. */
export function Dashes({ count, active, onSelect, label }: { count: number; active: number; onSelect: (i: number) => void; label: string }) {
  return (
    <div className="flex justify-center" role="tablist" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button key={i} role="tab" aria-selected={i === active} aria-label={`${i + 1} / ${count}`} onClick={() => onSelect(i)} className="grid h-11 w-9 place-items-center cursor-pointer">
          <span className={cn("h-1 rounded-full transition-all duration-200", i === active ? "w-7 bg-accent-ink" : "w-4 bg-border")} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header() {
  const { t } = usePrefs();
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    ["#producto", t.nav.product],
    ["#numeros", t.nav.data],
    ["#precios", t.nav.pricing],
  ] as const;
  return (
    <header className={cn("sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-colors duration-200", scrolled ? "border-border bg-background/85 backdrop-blur-xl" : "border-transparent")}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-4" />
          </span>
          Gestor Guita
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {links.map(([h, l]) => (
            <a key={h} href={h} className="transition-colors hover:text-foreground">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <PrefSwitches className="hidden sm:flex" />
          <MobilePrefs />
          <Link href="/auth" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground lg:block">{t.nav.login}</Link>
          <Link href="/dashboard" className="hidden h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex">{t.nav.cta}</Link>
          <button onClick={() => setSheet(true)} aria-label={t.nav.menu} className="grid size-11 place-items-center rounded-full border border-border md:hidden cursor-pointer">
            <Menu className="size-4" />
          </button>
        </div>
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button aria-label={t.nav.close} className="absolute inset-0 bg-foreground/30 cursor-pointer" onClick={() => setSheet(false)} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-background p-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <PrefSwitches />
              <button onClick={() => setSheet(false)} aria-label={t.nav.close} className="grid size-10 place-items-center rounded-full border border-border cursor-pointer"><X className="size-4" /></button>
            </div>
            <nav className="mt-6 flex flex-col">
              {links.map(([h, l]) => (
                <a key={h} href={h} onClick={() => setSheet(false)} className="border-b border-border py-4 text-lg">{l}</a>
              ))}
              <Link href="/auth" className="border-b border-border py-4 text-lg">{t.nav.login}</Link>
            </nav>
            <Link href="/dashboard" className="mt-6 flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{t.nav.cta}</Link>
          </motion.div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero with live input ---------------- */
const EN_CAT: Record<string, string> = { Transporte: "Transport", Comida: "Groceries", Salidas: "Going out", Servicios: "Bills", Suscripciones: "Subscriptions", Salud: "Health", Hogar: "Home", Ingresos: "Income", Otros: "Other" };
const EN_KEYS: [RegExp, string][] = [[/\b(gas|fuel|uber|taxi)\b/, "Transporte"], [/\b(groceries|food|lunch|dinner)\b/, "Comida"], [/\b(rent|internet|electricity)\b/, "Servicios"], [/\b(paid|salary|income)\b/, "Ingresos"]];

function useParsed(text: string, lang: "es" | "en") {
  return useMemo(() => {
    const p = parseMagicInput(lang === "en" ? text.replace(/(\d),(\d{3})/g, "$1.$2") : text);
    if (!p) return null;
    const low = text.toLowerCase();
    let cat = p.categoria;
    if (lang === "es" && /\bnafta\b/.test(low)) cat = "Transporte";
    if (lang === "en") for (const [re, c] of EN_KEYS) if (re.test(low)) { cat = c; break; }
    const currency = /\busdt\b/.test(low) ? "USDT" : /\b(usd|d[oó]lares?|dollars?|u\$s)\b/.test(low) ? "USD" : "ARS";
    return { ...p, categoria: cat, income: cat === "Ingresos", currency };
  }, [text, lang]);
}

function LiveInput() {
  const { t, lang } = usePrefs();
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const parsed = useParsed(text, lang);
  const locale = lang === "en" ? "en-US" : "es-AR";

  useEffect(() => {
    if (touched) return;
    if (reduce) { setText(t.hero.samples[0] ?? ""); return; }
    let s = 0, i = 0, del = false;
    let id: number;
    const tick = () => {
      const target = t.hero.samples[s % t.hero.samples.length] ?? "";
      if (!del) { i++; setText(target.slice(0, i)); if (i >= target.length) { del = true; id = window.setTimeout(tick, 1800); return; } }
      else { i--; setText(target.slice(0, i)); if (i <= 0) { del = false; s++; } }
      id = window.setTimeout(tick, del ? 22 : 55);
    };
    id = window.setTimeout(tick, 400);
    return () => window.clearTimeout(id);
  }, [touched, reduce, t]);

  const fmtDate = parsed ? new Date(parsed.fecha + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—";
  const rows: [string, ReactNode][] = [
    [t.hero.amount, parsed ? <span className={parsed.income ? "text-positive" : "text-foreground"}>{parsed.income ? "+" : "−"}${Math.abs(parsed.monto).toLocaleString(locale)}</span> : "—"],
    [t.hero.category, parsed ? (lang === "en" ? EN_CAT[parsed.categoria] ?? parsed.categoria : parsed.categoria) : "—"],
    [t.hero.date, fmtDate],
    [t.hero.currency, parsed?.currency ?? "—"],
    [t.hero.type, parsed ? (parsed.income ? t.hero.income : t.hero.expense) : "—"],
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-glow)]">
      <label htmlFor="live-input" className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="money uppercase">{t.hero.inputLabel}</span>
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-positive" />{parsed ? t.hero.saved : t.hero.waiting}</span>
      </label>
      <div className="px-5 py-5">
        <input
          id="live-input"
          value={text}
          onFocus={() => { if (!touched) { setTouched(true); setText(""); } }}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.hero.inputHint}
          autoComplete="off"
          className="w-full bg-transparent text-xl outline-none placeholder:text-muted-foreground sm:text-2xl"
        />
      </div>
      <dl className="grid grid-cols-2 border-t border-border sm:grid-cols-5">
        {rows.map(([k, v], idx) => (
          <div key={k} className={cn("border-border px-5 py-4", idx > 0 && "sm:border-l", idx % 2 === 1 && "border-l", idx > 1 && "border-t sm:border-t-0")}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="money mt-1 truncate text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const CATS = [
  { k: "rent", v: 41, c: "var(--cat-rent)" },
  { k: "food", v: 34, c: "var(--cat-food)" },
  { k: "fuel", v: 12, c: "var(--cat-fuel)" },
  { k: "out", v: 8, c: "var(--cat-out)" },
  { k: "transport", v: 5, c: "var(--cat-transport)" },
] as const;

function useMoney() {
  const { lang } = usePrefs();
  const loc = lang === "en" ? "en-US" : "es-AR";
  return (n: number, sign = false) => `${sign ? (n < 0 ? "−" : "+") : ""}$${Math.abs(n).toLocaleString(loc)}`;
}

function Donut({ size = 150 }: { size?: number }) {
  const r = 52, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden className="-rotate-90">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
      {CATS.map((c) => {
        const len = (c.v / 100) * C - 2;
        const el = <circle key={c.k} cx="70" cy="70" r={r} fill="none" stroke={c.c} strokeWidth="16" strokeDasharray={`${len} ${C}`} strokeDashoffset={-acc} />;
        acc += (c.v / 100) * C;
        return el;
      })}
    </svg>
  );
}

function HeroPhone() {
  const { t } = usePrefs();
  const m = useMoney();
  const P = t.hero.phone;
  const chips: [string, string, string][] = [
    [t.hero.cats.rent, "41%", "left-1 top-[14%] sm:left-[-8%] sm:top-[18%]"],
    [t.hero.cats.food, "34%", "right-1 top-[34%] sm:right-[-10%]"],
    [t.hero.cats.fuel, "12%", "left-1 top-[58%] sm:left-[-12%]"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-[420px] py-6">
      <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-positive/15 blur-3xl" />
      <div className="mx-auto w-[min(280px,100%)] rounded-[44px] border border-border bg-card p-2.5 dark:border-foreground/15 dark:bg-foreground/[0.06] shadow-[var(--shadow-glow)]">
        <div className="rounded-[36px] border border-border bg-background px-5 pb-6 pt-4">
          <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-muted" />
          <p className="money text-[11px] text-muted-foreground">{P.month}</p>
          <p className="mt-1 text-xs text-muted-foreground">{P.spent}</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="money text-2xl">{m(1574000)}</p>
            <span className="money rounded-full border border-border px-1.5 py-0.5 text-[10px] text-positive">{P.vs}</span>
          </div>
          <div className="relative mx-auto mt-3 grid w-fit place-items-center">
            <Donut />
            <div className="absolute text-center">
              <p className="text-[10px] text-muted-foreground">{P.available}</p>
              <p className="money text-sm">{m(426000)}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[[P.avg, m(52400)], [P.peak, P.peakV]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-card p-2.5">
                <p className="text-[10px] text-muted-foreground">{k}</p>
                <p className="money mt-0.5 text-xs">{v}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {[[P.tx1, P.today, -42300, "var(--cat-food)"], [P.tx2, P.yesterday, -15000, "var(--cat-fuel)"]].map(([d, w, v, c]) => (
              <li key={d as string} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ background: c as string }} />
                <span className="flex-1">{d}<span className="money ml-1 text-[10px] text-muted-foreground">· {w}</span></span>
                <span className="money text-negative">{m(v as number, true)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {chips.map(([l, v, pos], i) => (
        <span key={l} className={cn("float-loop absolute flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-[var(--shadow-glow)]", pos)} style={{ animationDelay: `${i * 0.8}s` }}>
          <span className="size-2 rounded-full" style={{ background: CATS[i]?.c }} />{l}<span className="money">{v}</span>
        </span>
      ))}
      <div className="absolute -bottom-2 right-1 w-40 sm:right-[-12%] sm:w-44 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-glow)]">
        <div className="flex items-center justify-between"><p className="text-[11px] text-muted-foreground">{P.trend}</p><span className="money text-[10px] text-positive">+8.4%</span></div>
        <svg viewBox="0 0 150 40" className="mt-2 h-10 w-full" aria-hidden>
          <polyline fill="none" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" points="5,32 52,24 99,27 145,10" />
          {[[5, 32], [52, 24], [99, 27], [145, 10]].map(([x, y]) => <circle key={x} cy={y} r="2.5" fill="var(--accent-ink)" />)}
        </svg>
        <div className="money flex justify-between text-[9px] text-muted-foreground">{P.months.map((mo) => <span key={mo}>{mo}</span>)}</div>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = usePrefs();
  return (
    <section className="container-x pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal><p className="money inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t.hero.eyebrow2}</p></Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display mt-6 break-words text-[2.25rem] leading-[1.05] min-[400px]:text-[2.75rem] sm:text-6xl lg:text-[4.5rem]">
              {t.hero.h1a}{" "}<em className="text-accent-ink">{t.hero.h1b}</em>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg text-base leading-7 [overflow-wrap:anywhere] text-muted-foreground md:text-lg">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth" className="bg-brand inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90 dark:text-lime-foreground">{t.hero.cta}<ArrowRight className="size-4" /></Link>
              <a href="#producto" className="inline-flex h-12 items-center rounded-full border border-border px-6 font-medium transition-colors hover:bg-muted">{t.hero.secondary}</a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t.hero.micro}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {t.hero.audience.map((a) => <li key={a} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{a}</li>)}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.25} className="lg:col-span-6"><HeroPhone /></Reveal>
      </div>
      <Reveal className="mt-16"><LiveInput /></Reveal>
    </section>
  );
}

function MockFrame({ head, foot, children }: { head: ReactNode; foot: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-glow)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">{head}</div>
      <div className="px-5 py-5">{children}</div>
      <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-3">{foot}</div>
    </div>
  );
}

function StepMock({ step }: { step: number }) {
  const { t, lang } = usePrefs();
  const m = useMoney();
  const loc = lang === "en" ? "en-US" : "es-AR";
  const H = ({ children }: { children: ReactNode }) => <p className="money flex items-center gap-2 text-xs text-muted-foreground">{children}</p>;
  if (step === 0)
    return (
      <MockFrame
        head={<><H><CloudOff className="size-3.5" />{t.story.offline}</H><span className="money text-xs text-muted-foreground">14:05</span></>}
        foot={<><p className="money flex items-center gap-2 text-xs text-positive"><RefreshCw className="size-3.5" />{t.story.synced}</p><span className="money text-xs text-muted-foreground">14:31</span></>}
      >
        <ul className="space-y-2">
          {[["Nafta YPF", -15000, "14:02"], ["Café", -3200, "14:05"], ["Super Coto", -42300, "14:05"]].map(([d, v, h]) => (
            <li key={d as string} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <span>{d}<span className="money ml-2 text-xs text-muted-foreground">{h}</span></span>
              <span className="money text-negative">{m(v as number, true)}</span>
            </li>
          ))}
        </ul>
      </MockFrame>
    );
  if (step === 1) {
    const rows = [["food", 233200, 320000, "var(--cat-food)"], ["transport", 98000, 120000, "var(--cat-transport)"], ["out", 61000, 90000, "var(--cat-out)"], ["fuel", 42000, 90000, "var(--cat-fuel)"]] as const;
    return (
      <MockFrame head={<><H>{t.story.chapters[1]?.k}</H><span className="money text-xs text-muted-foreground">{t.hero.phone.month}</span></>} foot={<><span className="text-xs text-muted-foreground">{t.data.sample}</span><span className="money text-xs">{m(434200)}</span></>}>
        <ul className="space-y-4">
          {rows.map(([k, v, l, c]) => (
            <li key={k}>
              <div className="flex items-baseline justify-between text-sm"><span>{t.hero.cats[k]}</span><span className="money text-xs text-muted-foreground">{m(v)} / {m(l)}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-border"><div className="h-1.5 rounded-full" style={{ width: `${(v / l) * 100}%`, background: c }} /></div>
            </li>
          ))}
        </ul>
      </MockFrame>
    );
  }
  return (
    <MockFrame head={<><H>{t.story.chapters[2]?.k}</H><span className="money text-xs text-muted-foreground">{t.hero.phone.month}</span></>} foot={<><span className="text-xs text-muted-foreground">{t.story.left}</span><span className="money text-xs text-positive">12/21</span></>}>
      <p className="text-sm text-muted-foreground">{t.story.perDay}</p>
      <p className="money mt-1 text-5xl">{`$${(8600).toLocaleString(loc)}`}</p>
      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 21 }, (_, i) => <span key={i} className={cn("aspect-square rounded-md", i < 12 ? "bg-positive/60" : i === 12 ? "bg-positive" : "bg-border")} />)}
      </div>
    </MockFrame>
  );
}

function Story() {
  const { t } = usePrefs();
  return (
    <section id="producto" className="scroll-mt-16 overflow-hidden border-t border-border py-16 md:py-24">
      <div className="container-x">
        <Reveal><Kicker>{t.story.kicker}</Kicker><h2 className="font-display mt-3 max-w-2xl text-4xl leading-tight md:text-6xl">{t.story.title}</h2></Reveal>
        <div className="mt-16 space-y-20 lg:space-y-32">
          {t.story.chapters.map((c, i) => (
            <div key={c.k} className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className={cn(i === 1 && "lg:order-2")}><StepMock step={i} /></Reveal>
              <Reveal delay={0.08} className="relative">
                <span aria-hidden className="money pointer-events-none absolute -left-4 -top-24 select-none text-[160px] leading-none text-foreground/[0.06] md:-top-36 md:text-[240px]">{String(i + 1).padStart(2, "0")}</span>
                <div className="relative max-w-[46ch] pt-8">
                  <p className="money text-xs uppercase text-accent-ink">{c.k}</p>
                  <h3 className="font-display mt-3 text-3xl leading-tight md:text-5xl">{c.h}</h3>
                  <p className="mt-4 leading-7 text-muted-foreground">{c.p}</p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Panel({ title, sub, children, className }: { title: string; sub: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-6", className)}>
      <h3 className="font-semibold">{title}</h3>
      <p className="money mt-1 text-xs text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Sankey() {
  const { t } = usePrefs();
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const flows = [
    { d: "M120,40 C260,40 260,40 400,40", w: 70, c: "var(--chart-2)" },
    { d: "M120,95 C260,95 260,120 400,120", w: 60, c: "var(--chart-3)" },
    { d: "M120,150 C260,150 260,205 400,205", w: 50, c: "var(--chart-1)" },
    { d: "M120,192 C260,192 260,120 400,120", w: 24, c: "var(--chart-3)" },
  ];
  const nodes: [number, number, number, string, string][] = [
    [100, 5, 210, t.data.salary, "$1.450k"],
    [400, 5, 70, t.data.fixed, "$620k"],
    [400, 85, 84, t.data.living, "$740k"],
    [400, 180, 50, t.data.savings, "$420k"],
  ];
  return (
    <svg ref={ref} viewBox="0 0 520 240" className="h-auto w-full" role="img" aria-label={t.data.sankeyT}>
      {flows.map((f, i) => (
        <motion.path key={i} d={f.d} fill="none" stroke={f.c} strokeOpacity={0.35} strokeWidth={f.w} initial={reduce ? false : { pathLength: 0 }} animate={seen ? { pathLength: 1 } : {}} transition={{ duration: 1.1, delay: i * 0.12, ease: EASE }} />
      ))}
      {nodes.map(([x, y, h, l, v]) => (
        <g key={l}>
          <rect x={x} y={y} width="20" height={h} rx="3" fill="var(--foreground)" />
          <text x={x === 100 ? x - 8 : x + 30} y={y + h / 2 - 4} textAnchor={x === 100 ? "end" : "start"} className="fill-foreground text-[12px]">{l}</text>
          <text x={x === 100 ? x - 8 : x + 30} y={y + h / 2 + 12} textAnchor={x === 100 ? "end" : "start"} className="fill-muted-foreground font-mono text-[11px]">{v}</text>
        </g>
      ))}
      <rect x="100" y="185" width="20" height="30" rx="3" fill="var(--foreground)" opacity="0.5" />
    </svg>
  );
}

function Heatmap() {
  const { t } = usePrefs();
  const cells = Array.from({ length: 18 * 7 }, (_, i) => {
    const d = i % 7;
    const v = ((i * 37) % 11) / 10 + (d >= 5 ? 0.35 : 0);
    return Math.min(4, Math.floor(v * 3));
  });
  const shade = ["bg-border", "bg-positive/25", "bg-positive/50", "bg-positive/75", "bg-positive"];
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((v, i) => <span key={i} className={cn("aspect-square rounded-[3px]", shade[v])} />)}
      </div>
      <div className="money mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        {t.data.less}{shade.map((s) => <span key={s} className={cn("size-3 rounded-[3px]", s)} />)}{t.data.more}
      </div>
    </div>
  );
}

function Timeline() {
  const { t } = usePrefs();
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const pts = [8, 9, 9.5, 12, 12.4, 11, 10.2, 11.5, 13, 14.8, 15.2, 17];
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / 11) * 480 + 10},${170 - p * 8}`).join(" ");
  const ev: [number, string][] = [[3, t.data.events[0] ?? ""], [6, t.data.events[1] ?? ""], [9, t.data.events[2] ?? ""]];
  return (
    <svg ref={ref} viewBox="0 0 500 190" className="h-auto w-full" role="img" aria-label={t.data.worthT}>
      <path d={`${path} L490,180 L10,180 Z`} fill="var(--positive)" opacity="0.1" />
      <motion.path d={path} fill="none" stroke="var(--positive)" strokeWidth="2" initial={reduce ? false : { pathLength: 0 }} animate={seen ? { pathLength: 1 } : {}} transition={{ duration: 1.4, ease: EASE }} />
      {ev.map(([i, l]) => {
        const x = (i / 11) * 480 + 10, y = 170 - (pts[i] ?? 0) * 8;
        return (
          <g key={l}>
            <line x1={x} x2={x} y1={y - 8} y2={18} stroke="var(--border)" strokeDasharray="2 3" />
            <circle cx={x} cy={y} r="4" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.5" />
            <text x={x} y={12} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">{l}</text>
          </g>
        );
      })}
      <text x="490" y={170 - 17 * 8 - 10} textAnchor="end" className="fill-foreground font-mono text-[12px]">US$17.000</text>
    </svg>
  );
}

function CurrencySplit() {
  const parts: [string, number, string][] = [["ARS", 38, "var(--chart-5)"], ["USD", 44, "var(--chart-1)"], ["USDT", 18, "var(--chart-2)"]];
  return (
    <div className="space-y-5">
      <div className="flex h-3 overflow-hidden rounded-full">
        {parts.map(([c, v, col]) => <span key={c} style={{ width: `${v}%`, background: col }} />)}
      </div>
      {parts.map(([c, v, col]) => (
        <div key={c} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: col }} />{c}</span>
          <span className="money text-muted-foreground">{v}%</span>
        </div>
      ))}
    </div>
  );
}

function DataShowcase() {
  const { t } = usePrefs();
  return (
    <section id="numeros" className="scroll-mt-16 border-t border-border bg-surface py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><Kicker>{t.data.kicker}</Kicker><h2 className="font-display mt-3 text-4xl md:text-6xl">{t.data.title}</h2><p className="mt-4 max-w-lg text-muted-foreground">{t.data.sub}</p></div>
            <SampleTag>{t.data.sample}</SampleTag>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7"><Panel title={t.data.sankeyT} sub={t.data.sankeyS}><Sankey /></Panel></Reveal>
          <Reveal delay={0.08} className="lg:col-span-5"><Panel title={t.data.heatT} sub={t.data.heatS}><Heatmap /></Panel></Reveal>
          <Reveal className="lg:col-span-8"><Panel title={t.data.worthT} sub={t.data.worthS}><Timeline /></Panel></Reveal>
          <Reveal delay={0.08} className="lg:col-span-4"><Panel title={t.data.fxT} sub={t.data.fxS}><CurrencySplit /></Panel></Reveal>
        </div>
      </div>
    </section>
  );
}

const SLIDE = "w-[88%] shrink-0 snap-start md:w-auto";

function Bento() {
  const { t, lang } = usePrefs();
  const locale = lang === "en" ? "en-US" : "es-AR";
  const track = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const slides = () => Array.from(track.current?.querySelectorAll<HTMLElement>(".snap-start") ?? []);
  const onTrack = () => {
    const el = track.current; if (!el) return;
    const list = slides(); let best = 0, d = Infinity;
    list.forEach((s, i) => { const dd = Math.abs(s.offsetLeft - el.offsetLeft - el.scrollLeft); if (dd < d) { d = dd; best = i; } });
    setSlide(best);
  };
  const goTo = (i: number) => { const el = track.current; const s = slides()[i]; if (el && s) el.scrollTo({ left: s.offsetLeft - el.offsetLeft, behavior: "smooth" }); };
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <Reveal><Kicker>{t.bento.kicker}</Kicker><h2 className="font-display mt-3 text-4xl md:text-6xl">{t.bento.title}</h2></Reveal>
        <div ref={track} onScroll={onTrack} className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] md:block md:overflow-visible md:pb-0">
        <Reveal className={SLIDE}>
          <div className="grid h-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-glow)] md:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="money text-xs uppercase opacity-60">{t.bento.bigK}</p>
              <h3 className="font-display mt-4 text-4xl leading-tight md:text-5xl">{t.bento.bigH}</h3>
              <p className="mt-4 max-w-md leading-7 opacity-70">{t.bento.bigP}</p>
            </div>
            <div className="flex flex-col justify-center gap-2 p-8 md:p-12">
              {[["14:02", "Nafta", "−15.000", true], ["14:05", "Café", "−3.200", true], ["14:31", "Sync", "✓", false]].map(([h, d, m, pending]) => (
                <div key={h as string} className="money flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <span className="opacity-60">{h}</span><span>{d}</span><span className={pending ? "text-negative" : "text-positive"}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="contents md:mt-4 md:grid md:grid-cols-3 md:gap-4">
          <Reveal className={cn(SLIDE, "md:col-span-1")}>
            <div className="h-full rounded-3xl border border-border bg-card p-6">
              <h3 className="font-semibold">{t.bento.fxH}</h3><p className="mt-1 text-sm text-muted-foreground">{t.bento.fxP}</p>
              <div className="money mt-6 space-y-2 text-sm">
                {[["Oficial", 1465], ["Blue", 1520]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">USD {k}</span><span>${(v as number).toLocaleString(locale)}</span></div>)}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08} className={SLIDE}>
            <div className="h-full rounded-3xl border border-border bg-card p-6">
              <h3 className="font-semibold">{t.bento.recH}</h3><p className="mt-1 text-sm text-muted-foreground">{t.bento.recP}</p>
              <div className="mt-6 space-y-2 text-sm">
                {[["Netflix", 11200], ["Spotify", 4100], ["Gimnasio", 28000]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-border pb-2"><span>{k}</span><span className="money text-muted-foreground">${(v as number).toLocaleString(locale)} {t.bento.monthly}</span></div>)}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.16} className={SLIDE}>
            <div className="h-full rounded-3xl border border-border bg-card p-6">
              <h3 className="font-semibold">{t.bento.vaultH}</h3><p className="mt-1 text-sm text-muted-foreground">{t.bento.vaultP}</p>
              <p className="mt-6 text-sm text-muted-foreground">{t.bento.youOwe}</p>
              <p className="money mt-1 text-3xl text-positive">${(46350).toLocaleString(locale)}</p>
            </div>
          </Reveal>
          <Reveal className={cn(SLIDE, "md:col-span-3")}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 md:flex-row md:items-center">
              <div><h3 className="font-semibold">{t.bento.trustH}</h3><p className="mt-1 text-sm text-muted-foreground">{t.bento.trustP}</p></div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm"><Download className="size-4" />{t.bento.export}</span>
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-destructive/40 px-4 text-sm text-destructive"><Trash2 className="size-4" />{t.bento.erase}</span>
              </div>
            </div>
          </Reveal>
        </div>
        </div>
        <div className="mt-2 md:hidden"><Dashes count={5} active={slide} onSelect={goTo} label={t.bento.kicker} /></div>
      </div>
    </section>
  );
}

function Cases() {
  const { t } = usePrefs();
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="container-x">
        <Reveal><Kicker>{t.cases.kicker}</Kicker><h2 className="font-display mt-3 text-4xl md:text-6xl">{t.cases.title}</h2></Reveal>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {t.cases.items.map((c, i) => (
            <Reveal key={c.who} delay={i * 0.08}>
              <div className="grid gap-4 py-8 md:grid-cols-12 md:items-baseline">
                <p className="money text-xs uppercase text-muted-foreground md:col-span-3">{c.who}</p>
                <div className="md:col-span-6"><h3 className="font-display text-2xl md:text-3xl">{c.h}</h3><p className="mt-2 leading-7 text-muted-foreground">{c.p}</p></div>
                <p className="money text-2xl md:col-span-3 md:text-right">{c.stat}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = usePrefs();
  return (
    <section id="precios" className="scroll-mt-16 border-t border-border bg-surface py-16 md:py-24">
      <div className="container-x">
        <Reveal><Kicker>{t.pricing.kicker}</Kicker><h2 className="font-display mt-3 text-4xl md:text-6xl">{t.pricing.title}</h2></Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {t.pricing.plans.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <div className={cn("flex h-full flex-col rounded-3xl border bg-card p-6", i === 1 ? "border-accent-ink" : "border-border")}>
                <div className="flex items-center justify-between"><h3 className="font-semibold">{p.n}</h3>{i === 1 && <span className="money rounded-full border border-accent-ink px-2 py-0.5 text-[11px] text-accent-ink">{t.pricing.popular}</span>}</div>
                <p className="mt-4"><span className="money text-4xl">{p.p}</span><span className="text-sm text-muted-foreground">{t.pricing.month}</span></p>
                <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {p.f.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-positive" />{f}</li>)}
                </ul>
                <Link href="/auth" className={cn("mt-8 flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-opacity hover:opacity-90", i === 1 ? "bg-brand text-primary-foreground dark:text-lime-foreground" : "border border-border")}>{p.c}</Link>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{t.pricing.note}</p>
      </div>
    </section>
  );
}

function Final() {
  const { t } = usePrefs();
  const m = useMoney();
  const rows = [
    ["rent", 1500000, 45, "var(--cat-rent)"],
    ["food", 572170, 17, "var(--cat-food)"],
    ["trips", 560000, 17, "var(--cat-trips)"],
    ["fuel", 350000, 10, "var(--cat-fuel)"],
    ["out", 172690, 5, "var(--cat-out)"],
  ] as const;
  return (
    <section className="relative overflow-hidden border-t border-border bg-surface pt-20 md:pt-28">
      <div className="container-x grid items-end gap-10 lg:grid-cols-2">
        <Reveal className="pb-12 md:pb-20">
          <h2 className="font-display text-4xl leading-tight md:text-6xl">{t.final.h} <em className="text-accent-ink">{t.final.h2}</em></h2>
          <Link href="/auth" className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground transition-opacity hover:opacity-90">{t.final.cta}<ArrowRight className="size-4" /></Link>
          <p className="mt-4 text-sm text-muted-foreground">{t.final.micro}</p>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div aria-hidden className="absolute bottom-0 left-1/2 -z-0 h-64 w-[120%] -translate-x-1/2 rounded-[50%] bg-positive/15 blur-3xl" />
          <div className="relative mx-auto h-[380px] w-[300px] overflow-hidden">
            <div className="rounded-t-[44px] border border-b-0 border-border bg-card p-2.5 pb-0">
              <div className="rounded-t-[36px] border border-b-0 border-border bg-background px-5 pb-10 pt-4">
                <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-muted" />
                <p className="text-xs text-muted-foreground">{t.final.summary}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{t.final.total}</p>
                <p className="money text-3xl">{m(3368650)}</p>
                <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
                  {rows.map(([k, , p, c]) => <span key={k} style={{ width: `${p}%`, background: c }} />)}
                </div>
                <ul className="mt-4 space-y-3">
                  {rows.map(([k, v, p, c]) => (
                    <li key={k}>
                      <div className="flex justify-between text-xs"><span>{t.hero.cats[k]}</span><span className="money">{m(v)}</span></div>
                      <div className="mt-1 h-1 rounded-full bg-border"><div className="h-1 rounded-full" style={{ width: `${p * 2}%`, background: c }} /></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = usePrefs();
  const L = t.footer.links;
  const cols: [string, [string, string][]][] = [
    [t.footer.product, [[L.features, "#producto"], [L.pricing, "#precios"], [L.security, "#producto"]]],
    [t.footer.company, [[L.about, "#producto"], [L.contact, "mailto:hola@gestorguita.app"]]],
    [t.footer.legal, [[L.terms, "#precios"], [L.privacy, "#precios"]]],
  ];
  return (
    <footer className="border-t border-border">
      <div className="container-x grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Landmark className="size-4" /></span>Gestor Guita</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
          <PrefSwitches className="mt-6" />
        </div>
        {cols.map(([h, ls]) => (
          <div key={h} className="md:col-span-2">
            <p className="money text-xs uppercase text-muted-foreground">{h}</p>
            <ul className="mt-4 space-y-2 text-sm">{ls.map(([l, href]) => <li key={l}><a href={href} className="hover:text-positive">{l}</a></li>)}</ul>
          </div>
        ))}
        <div className="md:col-span-1"><Link href="/dashboard" className="text-sm hover:text-positive">{L.app}</Link></div>
      </div>
      <div className="container-x money flex justify-between border-t border-border py-6 text-xs text-muted-foreground">
        <span>© 2026 Gestor Guita</span><span>{t.footer.made}</span>
      </div>
    </footer>
  );
}

function MobileCta() {
  const { t } = usePrefs();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={cn("fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 transition-all duration-200 sm:hidden", show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")}>
      <Link href="/auth" className="flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{t.nav.cta}</Link>
    </div>
  );
}

function MarketingLandingContent() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      <Header />
      <main>
        <Hero />
        <Story />
        <DataShowcase />
        <Bento />
        <Cases />
        <Pricing />
        <Final />
      </main>
      <Footer />
      <MobileCta />
    </div>
  );
}

export function MarketingLanding() {
  return (
    <PrefsProvider>
      <MarketingLandingContent />
    </PrefsProvider>
  );
}
