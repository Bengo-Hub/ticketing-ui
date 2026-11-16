"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const ORDER = ["light", "dark", "system"] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABEL: Record<ThemeChoice, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "Device theme",
};

const noopSubscribe = () => () => {};

/** Cycles light, dark and the device setting. The icon shows the current choice. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser, so the server and first render show a neutral icon.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const current: ThemeChoice = mounted && ORDER.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={`${LABEL[current]}. Switch to ${LABEL[next].toLowerCase()}`}
      title={LABEL[current]}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
