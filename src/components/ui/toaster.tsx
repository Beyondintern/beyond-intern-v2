"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

type Listener = (toasts: Toast[]) => void;

// Shared global state (same module reference as use-toast.ts pattern)
const listeners: Set<Listener> = new Set();
let globalToasts: Toast[] = [];

function notify() {
  listeners.forEach((l) => l(globalToasts));
}

export function dispatchToast(toast: Toast) {
  globalToasts = [...globalToasts, toast];
  notify();
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== toast.id);
    notify();
  }, toast.duration ?? 4500);
}

export function dismissToast(id: string) {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  notify();
}

/** Subscribe to the shared toast store; returns an unsubscribe function. */
export function subscribeToToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler: Listener = (t) => setToasts([...t]);
    const unsubscribe = subscribeToToasts(handler);
    handler(globalToasts); // Initial sync
    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`pointer-events-auto w-full rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 ${
              t.variant === "destructive"
                ? "bg-rose/10 border-rose/30 text-rose"
                : "bg-navy-light/90 border-white/10 text-white"
            }`}
          >
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold leading-snug">{t.title}</p>}
              {t.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Thin wrapper so components can call `showToast(...)` directly */
export function showToast(opts: Omit<Toast, "id">) {
  dispatchToast({ id: Math.random().toString(36).slice(2), ...opts });
}

/** Alias used by the useToast hook — same shared store. */
export const toast = showToast;
