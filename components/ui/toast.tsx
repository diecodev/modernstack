"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/utils/cn";

export type ToastStatus = "pending" | "processing" | "completed" | "failed";

export type Toast = {
  id: string;
  message: string;
  status: ToastStatus;
  filename?: string;
};

type ToastProps = {
  toast: Toast;
  onRemove: (id: string) => void;
};

const statusConfig = {
  pending: {
    icon: Loader2,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    iconClassName: "text-blue-400 animate-spin",
  },
  processing: {
    icon: Loader2,
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    iconClassName: "text-yellow-400 animate-spin",
  },
  completed: {
    icon: CheckCircle,
    className: "border-green-500/20 bg-green-500/10 text-green-400",
    iconClassName: "text-green-400",
  },
  failed: {
    icon: XCircle,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
    iconClassName: "text-red-400",
  },
};

export function ToastItem({ toast, onRemove }: ToastProps) {
  const config = statusConfig[toast.status];
  const Icon = config.icon;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border p-4 backdrop-blur-sm",
        "min-w-[300px] max-w-[400px]",
        config.className
      )}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", config.iconClassName)} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{toast.message}</p>
        {toast.filename && (
          <p className="truncate text-xs opacity-70">{toast.filename}</p>
        )}
      </div>
      {toast.status === "completed" || toast.status === "failed" ? (
        <button
          className="text-xs opacity-50 transition-opacity hover:opacity-100"
          onClick={() => onRemove(toast.id)}
          type="button"
        >
          ×
        </button>
      ) : null}
    </motion.div>
  );
}

type ToastContainerProps = {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
};

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} onRemove={onRemoveToast} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
