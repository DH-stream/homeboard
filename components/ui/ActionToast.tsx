"use client";

import { useEffect } from "react";

type ActionToastPlacement = "fixed" | "inline";
type ActionToastTone = "success";

export function ActionToast({
  message,
  onDismiss,
  placement = "fixed",
  tone = "success",
}: {
  message: string | null;
  onDismiss: () => void;
  placement?: ActionToastPlacement;
  tone?: ActionToastTone;
}) {
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(onDismiss, 1800);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={`action-toast action-toast--${tone} action-toast--${placement}`} role="status" aria-live="polite">
      <span className="action-toast__check" aria-hidden>
        ✓
      </span>
      <span className="min-w-0 truncate">{message}</span>
    </div>
  );
}
