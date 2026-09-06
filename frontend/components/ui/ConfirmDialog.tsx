"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "destructive",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const iconVariants = {
    destructive: <AlertTriangle className="h-6 w-6 text-red-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-400" />,
    primary: <Info className="h-6 w-6 text-emerald-400" />,
  };

  const buttonVariants: Record<string, "destructive" | "primary"> = {
    destructive: "destructive",
    warning: "destructive",
    primary: "primary",
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" showCloseButton={false}>
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
          {iconVariants[variant]}
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className="text-base font-semibold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800/80">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={buttonVariants[variant]}
          size="sm"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
