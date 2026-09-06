import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "emerald" | "purple" | "sky" | "amber" | "rose" | "zinc";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = "emerald",
  className,
}: StatCardProps) {
  const accentBorders = {
    emerald: "hover:border-emerald-500/40 hover:shadow-emerald-950/20",
    purple: "hover:border-purple-500/40 hover:shadow-purple-950/20",
    sky: "hover:border-sky-500/40 hover:shadow-sky-950/20",
    amber: "hover:border-amber-500/40 hover:shadow-amber-950/20",
    rose: "hover:border-rose-500/40 hover:shadow-rose-950/20",
    zinc: "hover:border-zinc-700 hover:shadow-zinc-950/20",
  };

  const iconBgStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        accentBorders[accentColor],
        className
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    trend.isPositive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  )}
                >
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-zinc-500 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0",
                iconBgStyles[accentColor]
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
