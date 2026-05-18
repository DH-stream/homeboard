"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_CLOSE_MS = 220;

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
  const [renderedMessage, setRenderedMessage] = useState(message);
  const [isVisible, setVisible] = useState(Boolean(message));
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;

    setRenderedMessage(message);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => onDismissRef.current(), 1800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [message]);

  useEffect(() => {
    if (message || !renderedMessage) return;

    setVisible(false);
    const timer = window.setTimeout(() => setRenderedMessage(null), TOAST_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [message, renderedMessage]);

  if (!renderedMessage) return null;

  return (
    <div className={`action-toast action-toast--${tone} action-toast--${placement} ${isVisible ? "action-toast--visible" : ""}`} role="status" aria-live="polite">
      <span className="action-toast__check" aria-hidden>
        ✓
      </span>
      <span className="min-w-0 truncate">{renderedMessage}</span>
    </div>
  );
}
