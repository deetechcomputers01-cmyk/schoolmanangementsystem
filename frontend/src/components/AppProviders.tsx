"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/desktop/ui/Toast/Toast";
import { ConfirmProvider } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";

/** Mounted once in the root layout so every page can call useToast()/useConfirm(). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
