"use client";

import type { Toast, ToastStatus } from "@/components/ui/toast";

// Simple store for toast management without external dependencies
class ToastStore {
  private toasts: Toast[] = [];
  private readonly listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getToasts(): Toast[] {
    return [...this.toasts];
  }

  addToast(message: string, status: ToastStatus, filename?: string): string {
    const ID_BASE = 36;
    const ID_START = 2;
    const ID_END = 15;
    const id = Math.random().toString(ID_BASE).substring(ID_START, ID_END);
    const toast: Toast = {
      id,
      message,
      status,
      filename,
    };

    this.toasts.push(toast);
    this.notify();

    return id;
  }

  updateToast(id: string, updates: Partial<Omit<Toast, "id">>) {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.toasts[index] = { ...this.toasts[index], ...updates };
      this.notify();
    }
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  // Auto-remove completed/failed toasts after delay
  autoRemoveToast(id: string, delay = 5000) {
    setTimeout(() => {
      const toast = this.toasts.find((t) => t.id === id);
      if (
        toast &&
        (toast.status === "completed" || toast.status === "failed")
      ) {
        this.removeToast(id);
      }
    }, delay);
  }
}

export const toastStore = new ToastStore();

// React hook for using the toast store
import { useEffect, useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>(() => toastStore.getToasts());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(() => {
      setToasts(toastStore.getToasts());
    });

    return unsubscribe;
  }, []);

  return {
    toasts,
    addToast: (message: string, status: ToastStatus, filename?: string) =>
      toastStore.addToast(message, status, filename),
    updateToast: (id: string, updates: Partial<Omit<Toast, "id">>) =>
      toastStore.updateToast(id, updates),
    removeToast: (id: string) => toastStore.removeToast(id),
    autoRemoveToast: (id: string, delay?: number) =>
      toastStore.autoRemoveToast(id, delay),
  };
}
