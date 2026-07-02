import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Check,
  Code2,
  Compass,
  Copy,
  Cpu,
  Globe,
  Instagram,
  Layers,
  Linkedin,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  Rocket,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useTheme } from "@/hooks/use-theme";
import wideaLogo from "@/assets/widea-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: WideaLanding,
});

/* -------------------------------------------------------------------------- */
/*  Screens definition                                                        */
/* -------------------------------------------------------------------------- */
const SCREENS = [
  { id: "home", label: "Início" },
  { id: "about", label: "Sobre" },
  { id: "services", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "process", label: "Processo" },
  { id: "testimonials", label: "Depoimentos" },
  { id: "contact", label: "Contato" },
] as const;

type ScreenId = (typeof SCREENS)[number]["id"];

const SOCIALS = [
  { id: "whatsapp",  label: "WhatsApp",  value: "+55 11 9 4000-0000", icon: MessageCircle, href: "https://wa.me/5511940000000",           copy: "+5511940000000" },
  { id: "email",     label: "Email",     value: "hello@wideamkt.com",  icon: Mail,          href: "mailto:hello@wideamkt.com",             copy: "hello@wideamkt.com" },
  { id: "instagram", label: "Instagram", value: "@wideamkt",           icon: Instagram,     href: "https://instagram.com/wideamkt",        copy: null as string | null },
  { id: "linkedin",  label: "LinkedIn",  value: "/wideamkt",           icon: Linkedin,      href: "https://linkedin.com/company/wideamkt", copy: null as string | null },
] as const;

/* -------------------------------------------------------------------------- */
/*  AnimatedNumber — count-up on scroll into view                             */
/* -------------------------------------------------------------------------- */
function parseNumeric(value: string) {
  const m = value.match(/^(\D*?)(-?[\d.,]+)(.*)$/);
  if (!m) return { prefix: "", suffix: "", target: 0, decimals: 0, useGrouping: false, valid: false };
  const prefix = m[1];
  const suffix = m[3];
  const raw = m[2];

  let intPart = raw;
  let decPart = "";
  let useGrouping = false;

  if (raw.includes(",")) {
    const [i, d = ""] = raw.split(",");
    intPart = i.replace(/\./g, "");
    decPart = d;
    useGrouping = i.includes(".");
  } else if (raw.includes(".")) {
    const parts = raw.split(".");
    const isThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].replace("-", "").length > 0 && parts[0].replace("-", "").length <= 3);
    if (isThousands) {
      intPart = parts.join("");
      useGrouping = true;
    } else {
      intPart = parts[0];
      decPart = parts.slice(1).join("");
    }
  }

  const numStr = decPart ? `${intPart}.${decPart}` : intPart;
  const target = parseFloat(numStr);
  const valid = !isNaN(target);
  return {
    prefix,
    suffix,
    target: valid ? target : 0,
    decimals: decPart.length,
    useGrouping: useGrouping || intPart.replace("-", "").length > 3,
    valid,
  };
}

function AnimatedNumber({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  const parsed = useMemo(() => parseNumeric(value), [value]);
  const { prefix, suffix, target, decimals, useGrouping, valid } = parsed;

  const cacheKey = `an:${value}`;
  const alreadyPlayed = typeof window !== "undefined" && window.sessionStorage?.getItem(cacheKey) === "1";

  const [display, setDisplay] = useState<number>(reduce || !valid || alreadyPlayed ? target : 0);
  const hasAnimated = useRef(alreadyPlayed);

  useEffect(() => {
    if (!valid || hasAnimated.current) return;
    if (reduce) { setDisplay(target); hasAnimated.current = true; return; }
    if (!inView) return;
    hasAnimated.current = true;
    try { window.sessionStorage?.setItem(cacheKey, "1"); } catch {}
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduce, valid, cacheKey]);

  if (!valid) return <span ref={ref}>{value}</span>;

  const formatted = display.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  });

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Root component                                                            */
/* -------------------------------------------------------------------------- */
function WideaLanding() {
  const [active, setActive] = useState<ScreenId>("home");
  const [prevIndex, setPrevIndex] = useState(0);
  const currentIndex = SCREENS.findIndex((s) => s.id === active);
  const direction = currentIndex >= prevIndex ? 1 : -1;
  const prefersReducedMotion = useReducedMotion();

  const go = useCallback(
    (id: ScreenId, source: string = "programmatic") => {
      setPrevIndex(SCREENS.findIndex((s) => s.id === active));
      setActive(id);
      track("screen_view", { screen_id: id, source });
    },
    [active]
  );

  // Global keyboard shortcuts: ←/→ Home/End
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        const next = SCREENS[(currentIndex + 1) % SCREENS.length];
        go(next.id, "keyboard");
      } else if (e.key === "ArrowLeft") {
        const prev = SCREENS[(currentIndex - 1 + SCREENS.length) % SCREENS.length];
        go(prev.id, "keyboard");
      } else if (e.key === "Home") {
        e.preventDefault();
        go("home", "keyboard");
      } else if (e.key === "End") {
        e.preventDefault();
        go("contact", "keyboard");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, go]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden text-foreground">
      <a href="#main" className="skip-link">Ir para o conteúdo principal</a>
      <AmbientBackground />
      {!prefersReducedMotion && <CursorLight />}
      <Nav active={active} onNavigate={go} />

      <main
        id="main"
        className="relative z-10 h-full w-full"
        aria-live="polite"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.section
            key={active}
            role="tabpanel"
            id={`panel-${active}`}
            aria-labelledby={`tab-${active}`}
            custom={direction}
            initial={prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, x: direction * 60, filter: "blur(16px)" }}
            animate={prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, x: direction * -60, filter: "blur(16px)" }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="safe-x absolute inset-0 flex items-start justify-center overflow-y-auto px-4 pt-24 pb-20 sm:px-6 sm:pt-28 sm:pb-24 md:pt-20 lg:items-center lg:overflow-hidden lg:pt-16 lg:pl-56 lg:pr-8 lg:pb-16 xl:pl-64 2xl:pl-72 2xl:pr-16"
          >
            <div className="thin-scroll w-full max-w-[1200px] lg:h-full lg:max-h-full xl:max-w-[1280px] 2xl:max-w-[1400px]">
              {active === "home" && <ScreenHome onNavigate={go} />}
              {active === "about" && <ScreenAbout />}
              {active === "services" && <ScreenServices />}
              {active === "portfolio" && <ScreenPortfolio />}
              {active === "process" && <ScreenProcess />}
              {active === "testimonials" && <ScreenTestimonials />}
              {active === "contact" && <ScreenContact />}
            </div>

          </motion.section>
        </AnimatePresence>
      </main>

      <FooterMini active={active} onNavigate={go} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ambient background + cursor light                                          */
/* -------------------------------------------------------------------------- */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px] pulse-glow" />
      <div className="absolute -bottom-40 -right-32 h-[600px] w-[600px] rounded-full bg-accent/25 blur-[160px] pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-1 w-1 rounded-full bg-white/40"
          style={{
            top: `${(i * 53) % 100}%`,
            left: `${(i * 37) % 100}%`,
            animation: `floaty ${6 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
            opacity: 0.35 + ((i % 4) * 0.1),
          }}
        />
      ))}
      <div className="absolute inset-0 noise" />
    </div>
  );
}

function CursorLight() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        x: sx, y: sy,
        background: "radial-gradient(circle, oklch(0.72 0.18 245 / 0.22) 0%, transparent 60%)",
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Navigation (left-anchored)                                                */
/* -------------------------------------------------------------------------- */
function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className={`btn-ghost grid h-10 w-10 place-items-center rounded-full transition-transform hover:rotate-12 ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

function Nav({ active, onNavigate }: { active: ScreenId; onNavigate: (id: ScreenId, source?: string) => void }) {
  const [open, setOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const onTabsKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
    const idx = buttons.findIndex((b) => b === document.activeElement);
    if (idx === -1) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      buttons[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  // Mobile menu: focus trap, ESC to close, focus return, body scroll lock
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    // Autofocus first item
    requestAnimationFrame(() => focusables()[0]?.focus());
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Return focus to trigger or previously focused element
      (triggerRef.current ?? previouslyFocused)?.focus?.();
    };
  }, [open]);

  const menuMotion = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, y: -12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 380, damping: 32 },
      };


  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-3 pt-3 sm:px-6 sm:pt-5 lg:hidden">
        <button
          onClick={() => onNavigate("home", "logo")}
          className="glass-strong group flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2"
          aria-label="WideaMKT — Ir para Início"
        >
          <span className="glass-strong relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl">
            <img src={wideaLogo.url} alt="" aria-hidden className="h-6 w-6 object-contain" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Widea<span className="text-gradient">MKT</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              track("cta_click", { location: "nav_mobile_header", label: "Proposta" });
              onNavigate("contact", "nav_mobile_header_cta");
            }}
            className="btn-primary hidden h-11 items-center gap-1.5 rounded-full px-4 text-xs font-medium sm:inline-flex"
          >
            Proposta
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            onClick={() => {
              track("cta_click", { location: "nav_mobile_header", label: "Proposta" });
              onNavigate("contact", "nav_mobile_header_cta");
            }}
            aria-label="Solicitar proposta"
            className="btn-primary grid h-11 w-11 place-items-center rounded-full sm:hidden"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </button>
          <ThemeToggle />
          <button
            ref={triggerRef}
            onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="btn-ghost grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex flex-col gap-1.5" aria-hidden>
            <span className={`h-0.5 w-4 bg-foreground transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 bg-foreground transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 bg-foreground transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </span>
          </button>
        </div>
      </header>


      {/* Desktop vertical sidebar (left) */}
      <aside
        aria-label="Navegação principal"
        className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block xl:left-6"
      >
        <div className="glass-strong flex flex-col items-stretch gap-2 rounded-3xl px-2 py-4">
          <button
            onClick={() => onNavigate("home", "logo")}
            className="group mx-auto mb-1 flex shrink-0 items-center justify-center"
            aria-label="WideaMKT — Ir para Início"
          >
            <span className="glass-strong relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl">
              <img src={wideaLogo.url} alt="" aria-hidden className="h-7 w-7 object-contain" />
              <span aria-hidden className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-0 blur transition-opacity duration-500 group-hover:opacity-60" />
            </span>
          </button>

          <div className="mx-3 h-px bg-white/10" aria-hidden />

          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Seções da página"
            aria-orientation="vertical"
            onKeyDown={onTabsKey}
            className="flex flex-col items-stretch gap-1 py-1"
          >
            {SCREENS.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  id={`tab-${s.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${s.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onNavigate(s.id, "nav")}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden
                    />
                  )}
                  <span
                    aria-hidden
                    className={`relative h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                      isActive ? "bg-gradient-to-br from-primary to-accent shadow-[0_0_10px_oklch(0.72_0.18_245/0.8)]" : "bg-white/30 group-hover:bg-white/60"
                    }`}
                  />
                  <span className={`relative whitespace-nowrap pr-1 ${isActive ? "text-foreground" : ""}`}>{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mx-3 h-px bg-white/10" aria-hidden />

          <button
            onClick={() => {
              track("cta_click", { location: "nav", label: "Solicitar Proposta" });
              onNavigate("contact", "nav_cta");
            }}
            className="btn-primary mx-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium"
          >
            Proposta
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </button>

          <div className="mt-1 flex justify-center">
            <ThemeToggle />
          </div>
        </div>

      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              id="mobile-menu"
              ref={menuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              {...menuMotion}
              style={{ transformOrigin: "top right" }}
              className="glass-strong fixed left-3 right-3 top-[76px] z-50 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-2xl p-3 shadow-2xl lg:hidden"
            >
              <nav aria-label="Menu móvel" className="grid gap-1">
                {SCREENS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onNavigate(s.id, "nav_mobile"); setOpen(false); }}
                    aria-current={active === s.id ? "page" : undefined}
                    className={`flex min-h-[44px] items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active === s.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {s.label}
                    <ArrowRight className="h-4 w-4 opacity-50" aria-hidden />
                  </button>
                ))}
                <button
                  onClick={() => {
                    track("cta_click", { location: "nav_mobile", label: "Solicitar Proposta" });
                    onNavigate("contact", "nav_mobile_cta");
                    setOpen(false);
                  }}
                  className="btn-primary mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Solicitar Proposta <ArrowUpRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}

function FooterMini({ active, onNavigate }: { active: ScreenId; onNavigate: (id: ScreenId, source?: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-6 pb-4">
      <div className="pointer-events-auto glass hidden items-center gap-6 rounded-full px-5 py-2 text-xs text-muted-foreground md:flex">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          Disponível para novos projetos · 2026
        </span>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        <span className="flex items-center gap-3" role="group" aria-label="Navegação por seção">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id, "footer_dot")}
              aria-label={`Ir para ${s.label}`}
              aria-current={active === s.id ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${active === s.id ? "w-8 bg-foreground" : "w-2 bg-white/30 hover:bg-white/60"}`}
            >
              <span className="sr-only">{i + 1}</span>
            </button>
          ))}
        </span>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        <span>© WideaMKT</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable                                                                   */
/* -------------------------------------------------------------------------- */
function SectionEyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      {icon ?? <Sparkles className="h-3 w-3 text-primary" aria-hidden />}
      {children}
    </span>
  );
}

function AnimatedWords({ text, className = "", gradient = false }: { text: string; className?: string; gradient?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={reduce ? { opacity: 0 } : { y: "0.6em", opacity: 0, filter: "blur(8px)" }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: reduce ? 0 : 0.15 + i * 0.06, duration: reduce ? 0.2 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`mr-[0.25em] inline-block ${gradient ? "text-gradient" : ""}`}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Home                                                              */
/* -------------------------------------------------------------------------- */
function ScreenHome({ onNavigate }: { onNavigate: (id: ScreenId, source?: string) => void }) {
  return (
    <div className="grid w-full items-center gap-8 lg:h-full lg:grid-cols-[1.05fr_1fr] lg:gap-10 2xl:gap-16">
      <div className="relative z-20 order-2 flex flex-col gap-5 sm:gap-6 lg:order-none">


        <h1 className="font-display text-[clamp(1.75rem,3.4vw,3.75rem)] font-semibold leading-[1.05]">
          <AnimatedWords text="Transformamos empresas comuns em" />
          <span className="block">
            <AnimatedWords text="marcas inesquecíveis." gradient />
          </span>
        </h1>


        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="max-w-xl text-base text-muted-foreground sm:text-lg 2xl:text-xl"
        >
          Na WideaMKT unimos criatividade, tecnologia e estratégia para acelerar resultados reais
          através do marketing digital de alta performance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="flex flex-wrap items-center gap-3"
        >
          <button
            onClick={() => {
              track("cta_click", { location: "hero", label: "Solicitar Proposta" });
              onNavigate("contact", "hero_cta");
            }}
            className="btn-primary group flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
          >
            Solicitar Proposta
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </button>
          <button
            onClick={() => {
              track("cta_click", { location: "hero", label: "Conheça nossos projetos" });
              onNavigate("portfolio", "hero_secondary");
            }}
            className="btn-ghost flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
          >
            Conheça nossos projetos
          </button>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { k: "+580", v: "Projetos" },
            { k: "+220", v: "Clientes" },
            { k: "98%", v: "Satisfação" },
            { k: "+R$11M", v: "Investidos" },
          ].map((s) => (
            <div key={s.v} className="glass rounded-2xl p-3">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground order-2">{s.v}</dt>
              <dd className="font-display text-xl font-semibold sm:text-2xl 2xl:text-3xl order-1"><AnimatedNumber value={s.k} /></dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.7 }}
          className="mt-2 flex flex-wrap items-center gap-3"
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Siga</span>
          <span aria-hidden className="h-px w-8 bg-white/15" />
          <ul className="flex items-center gap-2" aria-label="Redes sociais">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} — ${s.value} (abre em nova aba)`}
                    onClick={() => track("contact_click", { channel: s.id, location: "hero" })}
                    className="glass group grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-full transition-all hover:-translate-y-0.5 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Icon className="h-4 w-4 text-foreground transition-colors group-hover:text-primary" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>


      <div className="relative z-0 order-1 -mt-2 w-full lg:order-none lg:mt-0">
        <HeroVisual />
      </div>

    </div>
  );
}

function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 15 });
  const sry = useSpring(ry, { stiffness: 120, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden
      className="relative z-0 mx-auto flex h-[clamp(280px,42vh,560px)] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-3xl px-2 [perspective:1400px] xl:max-w-[600px] 2xl:h-[clamp(420px,50vh,680px)] 2xl:max-w-[720px]"
    >
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {/* Core orb */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary via-primary/50 to-accent opacity-90 blur-[2px] shadow-[0_0_120px_20px_oklch(0.72_0.18_245/0.5)]" style={{ width: "clamp(9rem, 32vw, 16rem)", height: "clamp(9rem, 32vw, 16rem)" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 [transform:translate(-50%,-50%)_translateZ(30px)]" style={{ width: "clamp(9rem, 32vw, 16rem)", height: "clamp(9rem, 32vw, 16rem)" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ width: "clamp(11rem, 40vw, 20rem)", height: "clamp(11rem, 40vw, 20rem)" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" style={{ width: "clamp(14rem, 52vw, 26rem)", height: "clamp(14rem, 52vw, 26rem)" }} />

        {/* Orbital dots — sized via container so they scale */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "clamp(11rem, 40vw, 20rem)", height: "clamp(11rem, 40vw, 20rem)" }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * 360;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.8)]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50%) rotate(${-angle}deg)`,
                  transformOrigin: "center",
                  animation: `pulseGlow ${3 + i * 0.4}s ease-in-out infinite`,
                }}
              />
            );
          })}
        </div>

        <FloatCard style={{ top: "clamp(2%, 3vw, 6%)", left: "clamp(2%, 3vw, 4%)", transform: "translateZ(80px)" }} delay={0}>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-medium">ROAS</span>
          </div>
          <div className="mt-1 font-display text-xl font-semibold"><AnimatedNumber value="7.4x" /></div>
          <div className="mt-2 flex h-8 items-end gap-1">
            {[40, 70, 55, 90, 65, 100, 85].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} className="w-1.5 rounded-t bg-gradient-to-t from-primary to-accent" />
            ))}
          </div>
        </FloatCard>

        <FloatCard style={{ top: "clamp(4%, 4vw, 8%)", right: "clamp(2%, 3vw, 4%)", transform: "translateZ(120px)" }} delay={0.4}>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-accent" aria-hidden />
            <span className="text-xs font-medium">AI Assistant</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Otimização em tempo real</div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-accent" />
          </div>
        </FloatCard>

        <FloatCard style={{ bottom: "clamp(6%, 5vw, 10%)", left: "clamp(2%, 3vw, 4%)", transform: "translateZ(60px)" }} delay={0.8}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-medium">SEO</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="font-display text-xl font-semibold"><AnimatedNumber value="#1" /></div>
            <div className="text-[11px] text-emerald-300"><AnimatedNumber value="+42%" /></div>
          </div>
        </FloatCard>

        <FloatCard style={{ bottom: "clamp(3%, 4vw, 6%)", right: "clamp(2%, 3vw, 4%)", transform: "translateZ(100px)" }} delay={1.2}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
            <span className="text-xs font-medium">Conversões</span>
          </div>
          <div className="mt-1 font-display text-xl font-semibold"><AnimatedNumber value="+318%" /></div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">últimos 30 dias</div>
        </FloatCard>

        <FloatCard style={{ top: "44%", right: "clamp(1%, 2vw, 3%)", transform: "translateZ(140px)" }} delay={1.6}>
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-medium">Alcance</span>
          </div>
          <div className="mt-1 font-display text-xl font-semibold"><AnimatedNumber value="2.4M" /></div>
        </FloatCard>
      </motion.div>
    </div>
  );
}

function FloatCard({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4 + delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      className="glass-strong absolute z-10 w-[clamp(120px,38vw,160px)] rounded-2xl p-2.5 shadow-[var(--shadow-card)] sm:p-3"
    >
      <div className="float" style={{ animationDelay: `${delay}s` }}>{children}</div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: About                                                             */
/* -------------------------------------------------------------------------- */
function ScreenAbout() {
  const timeline = [
    { icon: Compass, title: "Planejamento", desc: "Diagnóstico profundo e definição de metas." },
    { icon: Target, title: "Estratégia", desc: "Roadmap orientado por dados e ICP." },
    { icon: Palette, title: "Criação", desc: "Identidade, narrativa e peças premium." },
    { icon: Rocket, title: "Execução", desc: "Campanhas, produto e canais ativos." },
    { icon: TrendingUp, title: "Escala", desc: "Otimização contínua e crescimento." },
  ];

  return (
    <div className="grid h-full items-center gap-10 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-5">
        <h2 className="font-display text-[clamp(2rem,4.4vw,4rem)] font-semibold leading-[1.05]">
          Transformamos marcas ambiciosas em <span className="text-gradient">máquinas de crescimento</span>.
        </h2>
        <p className="max-w-xl text-muted-foreground 2xl:text-lg">
          Somos um time enxuto de estrategistas, designers e engenheiros obcecados por resultado.
          Trabalhamos com poucas marcas por vez para entregar experiência, narrativa e mídia com
          nível de detalhe cirúrgico.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
          {["Data-driven", "Design-first", "Full-funnel"].map((t) => (
            <div key={t} className="glass rounded-xl px-3 py-2 text-center text-sm">{t}</div>
          ))}
        </div>
      </div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Nosso método</span>
            <span className="text-xs text-primary">WIDEA · OS</span>
          </div>
          <ol className="relative space-y-4 pl-6">
            <span aria-hidden className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
            {timeline.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.li
                  key={t.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
                  className="relative"
                >
                  <span aria-hidden className="absolute -left-[26px] top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_14px_oklch(0.72_0.18_245/0.6)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    <span className="font-medium">{t.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                </motion.li>
              );
            })}
          </ol>
        </motion.div>
        <div aria-hidden className="float-slow absolute -top-6 -right-4 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Services                                                          */
/* -------------------------------------------------------------------------- */
function ScreenServices() {
  const services = [
    { icon: TrendingUp, title: "Marketing Digital", desc: "Estratégia full-funnel para escalar receita." },
    { icon: Search, title: "SEO", desc: "Rankings sustentáveis e tráfego orgânico." },
    { icon: Layers, title: "Landing Pages", desc: "Páginas que convertem visitantes em clientes." },
    { icon: Palette, title: "Branding", desc: "Identidade visual e narrativa marcante." },
    { icon: Instagram, title: "Social Media", desc: "Conteúdo que gera comunidade e vendas." },
    { icon: Target, title: "Gestão de Tráfego", desc: "Meta, Google e TikTok Ads com ROI real." },
    { icon: BrainCircuit, title: "IA aplicada", desc: "Modelos custom para acelerar operações." },
  ];


  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3.4rem)] font-semibold leading-[1.05]">
            Um ecossistema completo para <span className="text-gradient">acelerar sua marca</span>.
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Da estratégia à execução técnica, todos os serviços operam sob um único sistema de performance e branding.
        </p>
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="glass group relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-2xl p-4 text-left transition-all hover:border-white/25"
              >
                <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 opacity-0 transition-opacity duration-500 group-hover:from-primary/15 group-hover:to-accent/15 group-hover:opacity-100" />
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-white/10 transition-transform duration-500 group-hover:rotate-6">
                  <Icon className="h-5 w-5 text-white" aria-hidden />
                </span>
                <div>
                  <div className="font-display text-base font-semibold">{s.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ul>


      <Differentials />
    </div>
  );
}

function Differentials() {
  const items = [
    "Estratégias orientadas por dados", "Equipe especializada", "Atendimento humanizado",
    "IA aplicada ao marketing", "Desenvolvimento próprio", "Performance acima da média",
    "Transparência total", "Resultados mensuráveis",
  ];
  return (
    <div className="glass overflow-hidden rounded-2xl" role="list" aria-label="Diferenciais">
      <div
        className="flex gap-8 whitespace-nowrap px-4 py-3 text-sm text-muted-foreground"
        style={{ animation: "marquee 40s linear infinite", width: "max-content" }}
        aria-hidden
      >
        {[...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" /> {t}
          </span>
        ))}
      </div>
      {/* SR-only readable list */}
      <ul className="sr-only">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Portfolio                                                         */
/* -------------------------------------------------------------------------- */
type Project = {
  id: string;
  brand: string;
  tag: string;
  metric: string;
  hue: string;
  device: "laptop" | "phone" | "tablet";
  summary: string;
  challenge: string;
  outcome: string;
  metrics: { label: string; value: string }[];
  stack: string[];
  services: string[];
};

const PROJECTS: Project[] = [
  {
    id: "lumen",
    brand: "Lumen Studio",
    tag: "Branding + Landing Page",
    metric: "+412% leads qualificados",
    hue: "from-primary/60 to-accent/60",
    device: "laptop",
    summary: "Reposicionamento premium de um estúdio de arquitetura de alto padrão.",
    challenge:
      "A marca não comunicava o nível dos projetos entregues e perdia leads para concorrentes com identidade mais forte.",
    outcome:
      "Nova identidade, narrativa editorial e uma landing page de alta performance publicada em 45 dias. O time comercial passou a receber leads pré-qualificados semanalmente.",
    metrics: [
      { label: "Leads qualificados", value: "+412%" },
      { label: "Ticket médio", value: "+68%" },
      { label: "Conversão da LP", value: "6.1%" },
      { label: "Awards", value: "3x FWA" },
    ],
    stack: ["Landing Page", "Design System", "Meta Ads", "GA4"],
    services: ["Landing Pages", "Branding", "Marketing Digital", "Gestão de Tráfego"],
  },
  {
    id: "kore",
    brand: "Kore Fitness",
    tag: "Tráfego + Landing Page",
    metric: "ROAS 8.2x sustentado",
    hue: "from-emerald-500/50 to-primary/50",
    device: "phone",
    summary: "Aquisição performática para rede de estúdios de treino funcional.",
    challenge:
      "Custo por aluno em alta e taxa de conversão do site abaixo de 1.2%. Meta Ads sem estrutura de mensuração.",
    outcome:
      "Nova landing page focada em conversão + estrutura de campanhas com aprendizado contínuo. CPL caiu 63% em 60 dias e ROAS estabilizou em 8x.",
    metrics: [
      { label: "ROAS", value: "8.2x" },
      { label: "CPL", value: "-63%" },
      { label: "Conversão da LP", value: "5.4%" },
      { label: "Novos alunos/mês", value: "+320" },
    ],
    stack: ["Landing Page", "Meta Ads", "Google Ads", "GA4", "Hotjar"],
    services: ["Landing Pages", "Gestão de Tráfego", "Social Media", "Marketing Digital"],
  },
  {
    id: "norva",
    brand: "Norva Estate",
    tag: "SEO + Landing Page",
    metric: "#1 em 42 termos",
    hue: "from-accent/60 to-primary/40",
    device: "tablet",
    summary: "Plataforma imobiliária de alto padrão impulsionada por SEO técnico e IA.",
    challenge:
      "Portal antigo, lento e invisível no Google. Captação de leads limitada e sem previsibilidade de tráfego orgânico.",
    outcome:
      "Landing pages segmentadas por bairro, arquitetura SEO revista e assistentes de IA para qualificação. Autoridade de domínio dobrou em 6 meses.",
    metrics: [
      { label: "Tráfego orgânico", value: "+740%" },
      { label: "Termos no top 3", value: "42" },
      { label: "Conversão da LP", value: "4.8%" },
      { label: "Leads orgânicos", value: "+11x" },
    ],
    stack: ["Landing Page", "SEO técnico", "IA aplicada", "GA4"],
    services: ["Landing Pages", "SEO", "IA aplicada", "Branding"],
  },
];


function ScreenPortfolio() {
  const [i, setI] = useState(0);
  const [detail, setDetail] = useState<Project | null>(null);
  const current = PROJECTS[i];

  return (
    <div className="grid h-full items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-5">
        <h2 className="font-display text-[clamp(2rem,4.2vw,3.8rem)] font-semibold leading-[1.05]">
          Cases que falam por si.
        </h2>
        <div className="glass rounded-2xl p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.brand}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-xs uppercase tracking-widest text-primary">{current.tag}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{current.brand}</div>
              <p className="mt-2 text-sm text-muted-foreground">{current.summary}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-1.5 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-primary" aria-hidden /> {current.metric}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                track("portfolio_open_detail", { project_id: current.id, brand: current.brand });
                setDetail(current);
              }}
              className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            >
              Ver detalhes do case <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Selecionar projeto">
          {PROJECTS.map((p, idx) => (
            <button
              key={p.brand}
              role="tab"
              aria-selected={idx === i}
              onClick={() => {
                setI(idx);
                track("portfolio_select", { project_id: p.id, brand: p.brand });
              }}
              className={`glass rounded-full px-3 py-1.5 text-xs transition-all ${
                idx === i ? "text-foreground ring-1 ring-white/30" : "text-muted-foreground"
              }`}
            >
              0{idx + 1} · {p.brand}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex h-[340px] items-center justify-center sm:h-[460px] 2xl:h-[560px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={current.brand}
            initial={{ opacity: 0, scale: 0.94, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.94, rotateY: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => {
              track("portfolio_open_detail", { project_id: current.id, brand: current.brand, source: "mockup" });
              setDetail(current);
            }}
            aria-label={`Abrir detalhes do case ${current.brand}`}
            className="relative cursor-pointer rounded-2xl focus-visible:outline-none"
          >
            <MockupCluster hue={current.hue} device={current.device} />
          </motion.button>
        </AnimatePresence>
      </div>

      <ProjectDetailModal project={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function MockupCluster({ hue, device }: { hue: string; device: "laptop" | "phone" | "tablet" }) {
  return (
    <div className="relative h-[320px] w-[520px] max-w-[92vw] sm:h-[360px]">
      <div className="absolute left-1/2 top-1/2 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 float-slow">
        <div className="glass-strong rounded-t-2xl border-b-0 p-1.5 shadow-[var(--shadow-card)]">
          <div className={`relative h-[240px] overflow-hidden rounded-xl bg-gradient-to-br ${hue}`}>
            <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
            <div aria-hidden className="absolute left-4 top-4 flex gap-1">
              <span className="h-2 w-2 rounded-full bg-white/60" />
              <span className="h-2 w-2 rounded-full bg-white/40" />
              <span className="h-2 w-2 rounded-full bg-white/30" />
            </div>
            <div className="absolute left-4 top-10 right-4 space-y-2">
              <div className="h-2 w-24 rounded-full bg-white/70" />
              <div className="h-1.5 w-40 rounded-full bg-white/40" />
              <div className="h-1.5 w-32 rounded-full bg-white/30" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((n) => <div key={n} className="h-16 rounded-lg bg-white/15 backdrop-blur" />)}
            </div>
          </div>
        </div>
        <div className="mx-auto h-2 w-[460px] max-w-[96vw] rounded-b-2xl bg-white/20" />
        <div className="mx-auto -mt-0.5 h-3 w-[300px] max-w-[60vw] rounded-b-2xl bg-white/10" />
      </div>

      {(device === "phone" || device === "laptop") && (
        <div className="float absolute -right-2 top-8 w-[110px] rotate-6">
          <div className="glass-strong rounded-[22px] p-1.5">
            <div className={`h-[200px] rounded-[18px] bg-gradient-to-br ${hue} p-2`}>
              <div className="h-1 w-6 rounded-full bg-white/60" />
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-16 rounded-full bg-white/70" />
                <div className="h-1 w-20 rounded-full bg-white/40" />
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="h-8 rounded-md bg-white/20" />
                <div className="h-8 rounded-md bg-white/15" />
                <div className="h-8 rounded-md bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      )}

      {device === "tablet" && (
        <div className="float absolute -left-6 -bottom-2 w-[170px] -rotate-6">
          <div className="glass-strong rounded-2xl p-1.5">
            <div className={`h-[210px] rounded-xl bg-gradient-to-br ${hue}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDetailModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // Simple focus trap
        const focusables = document.querySelectorAll<HTMLElement>(
          "#project-modal button, #project-modal a, #project-modal [tabindex='0']"
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          id="project-modal"
        >
          <button
            aria-label="Fechar detalhes do projeto"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-md"
            tabIndex={-1}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-hidden rounded-3xl shadow-[var(--shadow-card)]"
          >
            <div className={`relative h-32 bg-gradient-to-br ${project.hue} sm:h-40`}>
              <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Fechar"
                className="btn-ghost absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <div className="absolute bottom-4 left-5">
                <div className="text-[11px] uppercase tracking-widest text-white/80">{project.tag}</div>
                <h3 id="project-modal-title" className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {project.brand}
                </h3>
              </div>
            </div>

            <div className="thin-scroll max-h-[calc(90dvh-8rem)] space-y-6 overflow-y-auto p-5 sm:p-6">
              <p className="text-sm text-muted-foreground sm:text-base">{project.summary}</p>

              <section>
                <h4 className="mb-2 text-xs uppercase tracking-widest text-primary">Desafio</h4>
                <p className="text-sm">{project.challenge}</p>
              </section>

              <section>
                <h4 className="mb-2 text-xs uppercase tracking-widest text-primary">Resultado</h4>
                <p className="text-sm">{project.outcome}</p>
              </section>

              <section>
                <h4 className="mb-3 text-xs uppercase tracking-widest text-primary">Métricas</h4>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {project.metrics.map((m) => (
                    <div key={m.label} className="glass rounded-xl p-3">
                      <dd className="font-display text-xl font-semibold sm:text-2xl"><AnimatedNumber value={m.value} /></dd>
                      <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</dt>
                    </div>
                  ))}
                </dl>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <section>
                  <h4 className="mb-2 text-xs uppercase tracking-widest text-primary">Stack</h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {project.stack.map((s) => (
                      <li key={s} className="glass rounded-full px-3 py-1 text-xs">{s}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="mb-2 text-xs uppercase tracking-widest text-primary">Serviços</h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {project.services.map((s) => (
                      <li key={s} className="glass rounded-full px-3 py-1 text-xs">{s}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">

                <button
                  onClick={() => {
                    track("cta_click", {
                      location: "portfolio_modal",
                      label: "Quero um projeto assim",
                      project_id: project.id,
                    });
                    onClose();
                    // Small delay to let modal exit before switching screens
                    setTimeout(() => {
                      const el = document.querySelector<HTMLButtonElement>('[id="tab-contact"]');
                      el?.click();
                    }, 200);
                  }}
                  className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
                >
                  Quero um projeto assim
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Process                                                           */
/* -------------------------------------------------------------------------- */
function ScreenProcess() {
  const steps = [
    { n: "01", title: "Descoberta", icon: Compass, desc: "Imersão em negócio, marca e público." },
    { n: "02", title: "Planejamento", icon: Target, desc: "Estratégia, KPIs e roadmap detalhado." },
    { n: "03", title: "Desenvolvimento", icon: Cpu, desc: "Design, conteúdo e implementação técnica." },
    { n: "04", title: "Lançamento", icon: Rocket, desc: "Go-live coordenado com mídia e PR." },
    { n: "05", title: "Crescimento", icon: TrendingUp, desc: "Otimização, testes e escala contínua." },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-8">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="font-display text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.05]">
          5 etapas para transformar<br />ideia em <span className="text-gradient">resultado</span>.
        </h2>
      </div>

      <ol className="relative">
        <div aria-hidden className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent lg:block" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.6 }}
                className="glass group relative flex flex-col gap-3 rounded-2xl p-4"
              >
                <div className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold shadow-[0_0_25px_oklch(0.72_0.18_245/0.6)]">
                  {s.n}
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.li>
            );
          })}
        </div>
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Testimonials                                                      */
/* -------------------------------------------------------------------------- */
function ScreenTestimonials() {
  const reduce = useReducedMotion();
  const items = useMemo(
    () => [
      { name: "Isabela Martins", role: "CEO, Lumen Studio",
        quote: "A WideaMKT reposicionou nossa marca em 90 dias. Multiplicamos leads qualificados por 4 e o time comercial finalmente respira.",
        initials: "IM" },
      { name: "Rafael Costa", role: "Founder, Kore Fitness",
        quote: "Nunca vimos ROAS assim. Estratégia, criativo e mídia em sinergia. Sentimos que temos um sócio, não uma agência.",
        initials: "RC" },
      { name: "Carolina Prado", role: "Diretora, Norva Estate",
        quote: "Elegância em cada detalhe. Do branding ao sistema de gestão, tudo parece feito por uma marca internacional.",
        initials: "CP" },
    ], []);

  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length, reduce]);

  const t = items[i];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <h2 className="max-w-3xl font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.1]">
        O que dizem as marcas que <span className="text-gradient">crescem com a gente</span>.
      </h2>

      <div className="w-full max-w-2xl" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            className="glass-strong flex flex-col items-center gap-5 rounded-3xl p-6 sm:p-8"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-xl font-semibold text-white shadow-[0_0_30px_oklch(0.72_0.18_245/0.6)]" aria-hidden>
              {t.initials}
            </div>
            <div className="flex gap-1" aria-label="5 de 5 estrelas">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-primary text-primary" aria-hidden />
              ))}
            </div>
            <blockquote className="text-balance text-lg leading-relaxed text-foreground/90 sm:text-xl">
              "{t.quote}"
            </blockquote>
            <figcaption className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t.name}</span> · {t.role}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2" role="tablist" aria-label="Depoimentos">
        {items.map((_, k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === i}
            aria-label={`Depoimento ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-2 rounded-full transition-all ${k === i ? "w-8 bg-foreground" : "w-2 bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen: Contact                                                           */
/* -------------------------------------------------------------------------- */
function ScreenContact() {
  return (
    <div className="grid h-full items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col gap-5">
        <h2 className="font-display text-[clamp(2rem,4.4vw,4rem)] font-semibold leading-[1.02]">
          Vamos construir sua <span className="text-gradient">próxima grande ideia</span>?
        </h2>
        <p className="max-w-md text-muted-foreground">
          Fale direto com um estrategista sênior pelo canal que preferir. Respondemos em até 24 horas úteis.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            Disponível para novos projetos
          </span>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Canais de contato">
        {SOCIALS.map((s) => (
          <li key={s.id}>
            <ContactCard icon={s.icon} label={s.label} value={s.value} channel={s.id} href={s.href} copy={s.copy ?? undefined} />
          </li>
        ))}
      </ul>
    </div>
  );
}



function ContactCard({
  icon: Icon, label, value, channel, href = "#", copy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; channel: string; href?: string; copy?: string;
}) {
  const external = href.startsWith("http");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = copy ?? value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure contexts
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    track("contact_copy", { channel, label });
    toast.success(`${label} copiado`, {
      description: text,
      duration: 1800,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="glass group relative flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-white/25 focus-within:border-white/25">
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={() => track("contact_click", { channel, label })}
        aria-label={`${label}: ${value}${external ? " (abre em nova aba)" : ""}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="sr-only">{label}: {value}</span>
      </a>

      <span className="pointer-events-none grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-white/10 transition-transform group-hover:rotate-6">
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{value}</div>
      </div>

      {copy ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copiar ${label.toLowerCase()} para a área de transferência`}
          aria-live="polite"
          className="relative z-10 grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 text-emerald-400"
              >
                <Check className="h-4 w-4" aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      ) : (
        <ArrowUpRight className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      )}
    </div>
  );
}
