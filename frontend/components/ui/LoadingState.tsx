import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Memuat data...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
      <p className="text-xs sm:text-sm text-zinc-400 font-medium">{message}</p>
    </div>
  );
}
