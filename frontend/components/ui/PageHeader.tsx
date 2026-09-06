import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  icon?: React.ReactNode;
  badgeText?: string;
  badgeVariant?: "primary" | "purple" | "sky" | "warning";
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  badgeText,
  badgeVariant = "purple",
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const badgeStyles = {
    primary: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          {icon && (
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              {icon}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {badgeText && (
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-mono font-semibold rounded border",
                badgeStyles[badgeVariant]
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
