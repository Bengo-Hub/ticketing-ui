"use client";

import { useSyncExternalStore } from "react";

/**
 * A shared wall clock that ticks every 30 seconds while anything reads it. Components read the
 * time through useSyncExternalStore, so a countdown re-renders on each tick with no effect that
 * sets state and no Date.now() during render. The server and the hydrating render see 0, which
 * callers treat as "time not known yet".
 */

const TICK_MS = 30_000;
const listeners = new Set<() => void>();
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    // The clock may have been idle; React re-reads the snapshot after subscribing, so this
    // fresh value shows straight away.
    now = Date.now();
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): number {
  if (now === 0) now = Date.now();
  return now;
}

const getServerSnapshot = (): number => 0;

/** Milliseconds since the epoch, refreshed every 30 seconds; 0 on the server and while hydrating. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
