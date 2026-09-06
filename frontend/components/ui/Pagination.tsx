"use client";

import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between text-xs text-zinc-500 py-3 px-1">
        <span>Menampilkan {totalItems} data</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 py-3 px-1">
      <div>
        Menampilkan <span className="font-semibold text-zinc-200">{startItem}</span>-
        <span className="font-semibold text-zinc-200">{endItem}</span> dari{" "}
        <span className="font-semibold text-zinc-200">{totalItems}</span> data
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        <span className="px-3 py-1 text-xs font-mono font-medium text-zinc-300 bg-zinc-800/80 rounded-lg border border-zinc-700/60">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman selanjutnya"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
