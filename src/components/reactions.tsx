"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { Plus } from "lucide-react";
import { useCopy, useLanguage } from "./language";

type TargetType = "project" | "certificate";
type Item = { counts: Record<string, number>; mine: string | null };
const empty: Item = { counts: {}, mine: null };
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export function useReactions(type: TargetType) {
  const [items, setItems] = useState<Record<string, Item>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reactions?type=${type}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Reactions unavailable");
      return response.json() as Promise<{ items: Record<string, Item> }>;
    }).then((result) => { setItems(result.items); }).catch(() => {});
    return () => controller.abort();
  }, [type]);

  async function react(id: string, reaction: string) {
    if (busy || items[id]?.mine === reaction) return;
    setBusy(id);
    setError(null);
    try {
      const send = () => fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id, reaction }) });
      let response = await send();
      if (response.status === 401) {
        const visitor = await fetch("/api/visitors", { method: "POST", credentials: "same-origin" });
        if (!visitor.ok) throw new Error("Could not register visitor");
        response = await send();
      }
      if (!response.ok) throw new Error("Could not save reaction");
      const item = await response.json() as Item;
      setItems((previous) => ({ ...previous, [id]: item }));
    } catch { setError(id); }
    finally { setBusy(null); }
  }

  return { items, busy, error, react };
}

export function ReactionBar({ id, item, busy, error, onReact }: { id: string; item?: Item; busy: boolean; error: boolean; onReact: (id: string, reaction: string) => Promise<void> }) {
  const c = useCopy().reactions;
  const language = useLanguage();
  const current = item ?? empty;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 340, height: 400 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node) || triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    const onMove = () => setOpen(false);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const shown = Object.entries(current.counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return <div className="reaction-bar"><span className="reaction-label">{c.label}</span><div className="reaction-summary">{shown.length ? shown.map(([emoji, count]) => <span className={`reaction-pill ${current.mine === emoji ? "reaction-pill-mine" : ""}`} key={emoji} title={`${emoji} · ${count}`}><span>{emoji}</span>{count}</span>) : <span className="reaction-empty">{c.empty}</span>}</div><button ref={triggerRef} type="button" className={`reaction-trigger ${current.mine ? "reaction-trigger-active" : ""}`} aria-label={current.mine ? c.change : c.add} aria-expanded={open} title={c.onePerItem} disabled={busy} onClick={(event) => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.fromTo(event.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.28, ease: "back.out(2)" });
    if (!open) {
      const rect = event.currentTarget.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 24);
      const height = Math.min(400, window.innerHeight - 32);
      const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
      const top = rect.bottom + height + 10 <= window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
      setPosition({ top, left, width, height });
    }
    setOpen((previous) => !previous);
  }}><Plus size={18} /></button>
    {error && <small role="status">{c.error}</small>}
    {open && createPortal(<div className="reaction-popover" ref={popoverRef} style={{ top: position.top, left: position.left }} role="dialog" aria-label={c.pickerLabel}><EmojiPicker colorScheme="dark" lang={language} width={position.width} height={position.height} searchPlaceholder={c.search} searchLabel={c.pickerLabel} emojiData={language === "id" ? () => import("emoji-picker-react/data/emojis-ms") : undefined} previewConfig={{ showPreview: false }} className="site-emoji-picker" onEmojiClick={(emoji) => { setOpen(false); void onReact(id, emoji.emoji); }} /></div>, document.body)}
  </div>;
}
