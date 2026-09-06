"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variantStyles = {
      primary:
        "bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 shadow-sm shadow-emerald-950/40 hover:shadow-md hover:shadow-emerald-900/30",
      secondary:
        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80 border border-zinc-700/50 shadow-sm",
      outline:
        "bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 hover:text-white hover:border-zinc-600",
      destructive:
        "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50",
      ghost:
        "bg-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
      link:
        "bg-transparent text-emerald-400 underline-offset-4 hover:underline p-0 h-auto font-normal",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
      md: "text-sm px-4 py-2 rounded-xl gap-2",
      lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
      icon: "h-9 w-9 p-0 rounded-xl justify-center items-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
