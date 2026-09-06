"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a safe fallback if used outside provider
    return {
      toasts: [],
      showToast: (t: any) => console.log("Toast:", t),
      removeToast: () => {},
    };
  }
  return context;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const iconMap = {
    success: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />,
    error: <XCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0" />,
    info: <Info className="h-4.5 w-4.5 text-sky-400 flex-shrink-0" />,
  };

  const bgStyles = {
    success: "bg-zinc-900/95 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20",
    error: "bg-zinc-900/95 border-red-500/30 text-red-300 shadow-red-950/20",
    warning: "bg-zinc-900/95 border-amber-500/30 text-amber-300 shadow-amber-950/20",
    info: "bg-zinc-900/95 border-sky-500/30 text-sky-300 shadow-sky-950/20",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200",
        bgStyles[toast.type]
      )}
      role="alert"
    >
      <div className="mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 space-y-0.5">
        {toast.title && (
          <p className="text-xs font-semibold text-white tracking-tight">
            {toast.title}
          </p>
        )}
        <p className="text-xs text-zinc-300 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md"
        aria-label="Tutup notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
