import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "purple"
    | "sky";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700/60",
    primary: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    secondary: "bg-zinc-800/80 text-zinc-300 border-zinc-700/40",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    destructive: "bg-red-500/15 text-red-300 border-red-500/30",
    outline: "bg-transparent text-zinc-400 border-zinc-700",
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
