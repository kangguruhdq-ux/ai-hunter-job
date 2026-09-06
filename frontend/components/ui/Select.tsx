import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-zinc-300 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "flex h-10 w-full appearance-none rounded-xl border bg-zinc-900/80 px-3.5 py-2 pr-10 text-sm text-zinc-100 transition-all duration-200 cursor-pointer",
              "border-zinc-800 hover:border-zinc-700 focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/20 text-red-100",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 flex items-center pointer-events-none text-zinc-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-red-400 mt-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
