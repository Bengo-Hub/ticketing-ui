/**
 * A page-level theme override, read by the root ThemeProvider as next-themes' `forcedTheme`. The
 * embeddable widget sets it from its `theme` search param so the panel matches the host site,
 * without writing the visitor's saved theme (next-themes' setTheme would persist it).
 */
export type ForcedTheme = "light" | "dark";

let forced: ForcedTheme | undefined;
const listeners = new Set<() => void>();

export function getForcedTheme(): ForcedTheme | undefined {
  return forced;
}

export function getServerForcedTheme(): ForcedTheme | undefined {
  return undefined;
}

export function subscribeForcedTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setForcedTheme(next: ForcedTheme | undefined) {
  if (next === forced) return;
  forced = next;
  listeners.forEach((l) => l());
}

export function parseForcedTheme(value: string | null | undefined): ForcedTheme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}
