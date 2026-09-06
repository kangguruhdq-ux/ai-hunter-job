import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30",
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mt-1 mb-5">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
