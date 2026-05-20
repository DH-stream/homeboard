"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const node = contentRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setContentHeight(isOpen ? "none" : "0px");
      return;
    }

    let frame = 0;
    let timeout = 0;

    if (isOpen) {
      setContentHeight("0px");
      frame = window.requestAnimationFrame(() => {
        setContentHeight(`${node.scrollHeight}px`);
        timeout = window.setTimeout(() => setContentHeight("none"), 230);
      });
    } else {
      const from = `${node.scrollHeight}px`;
      setContentHeight(from);
      frame = window.requestAnimationFrame(() => setContentHeight("0px"));
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isOpen]);

  return (
    <section className="rounded-[1.75rem] border border-stone-200/80 bg-white/95 shadow-[0_10px_26px_rgba(36,28,21,0.07)] sm:rounded-[2rem]">
      <button aria-expanded={isOpen} className="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-3.5 text-left sm:px-6 sm:py-4" onClick={() => setIsOpen((current) => !current)} type="button">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">{eyebrow ?? title}</p>
          <h2 className="mt-1 text-base font-black tracking-tight text-stone-950 sm:text-lg">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-stone-700">{description}</p>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {status ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{status}</p> : null}
          <span className={`text-stone-500 transition-transform duration-200 ease-[var(--ease-out)] ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
        </div>
      </button>
      <div className={`settings-section-content ${isOpen ? "settings-section-content--open" : ""}`} style={{ maxHeight: contentHeight }}>
        <div className="settings-section-content__inner" ref={contentRef}>
          <div className="border-t border-stone-100 px-3 py-3 sm:px-6 sm:py-5">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
