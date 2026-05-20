"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";

type SettingsSectionProps = {
  title: string;
  description: string;
  eyebrow?: string;
  status?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function SettingsSection({ title, description, eyebrow, status, defaultOpen = false, children }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? "none" : "0px");
  const contentHeightRef = useRef(contentHeight);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    contentHeightRef.current = contentHeight;
  }, [contentHeight]);

  useEffect(() => {
    if (!contentRef.current) return;
    if (defaultOpen) {
      setContentHeight("none");
      return;
    }
    setContentHeight("0px");
  }, [defaultOpen]);

  useEffect(() => {
    if (!contentRef.current) return;
    const nextHeight = contentRef.current.scrollHeight;
    if (isOpen) {
      setContentHeight(`${nextHeight}px`);
      const timeout = window.setTimeout(() => setContentHeight("none"), 320);
      return () => window.clearTimeout(timeout);
    }

    if (contentHeightRef.current === "none") {
      setContentHeight(`${nextHeight}px`);
      requestAnimationFrame(() => setContentHeight("0px"));
      return;
    }

    setContentHeight("0px");
  }, [isOpen]);

  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white/95 shadow-[0_10px_26px_rgba(36,28,21,0.07)]">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left sm:px-6"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{eyebrow ?? title}</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-stone-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-stone-700">{description}</p>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {status ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{status}</p> : null}
          <span
            aria-hidden="true"
            className={`text-stone-500 transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            ⌄
          </span>
        </div>
      </button>
      <div
        className="overflow-hidden border-t border-stone-100 transition-[max-height] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{ maxHeight: contentHeight }}
      >
        <div
          className={`px-4 py-4 transition-all duration-200 ease-[var(--ease-out)] sm:px-6 sm:py-5 motion-reduce:transition-none ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-60"}`}
          id={panelId}
          ref={contentRef}
        >
          <div className="grid gap-4 md:grid-cols-2">{children}</div>
        </div>
      </div>
    </section>
  );
}
