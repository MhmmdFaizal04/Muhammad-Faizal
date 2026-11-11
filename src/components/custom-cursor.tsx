"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!cursor || !pointer.matches) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const moveX = gsap.quickTo(cursor, "x", { duration: reducedMotion ? 0 : 0.06, ease: "power2.out" });
    const moveY = gsap.quickTo(cursor, "y", { duration: reducedMotion ? 0 : 0.06, ease: "power2.out" });
    let interactive = false;
    let visible = false;

    function onMove(event: PointerEvent) {
      if (!cursor || event.pointerType !== "mouse") return;
      moveX(event.clientX - 2);
      moveY(event.clientY - 2);
      if (!visible) {
        visible = true;
        gsap.to(cursor, { opacity: 1, duration: 0.16, overwrite: "auto" });
      }
      const hovering = Boolean((event.target as Element)?.closest?.("a, button, [role='button']"));
      if (hovering !== interactive) {
        interactive = hovering;
        gsap.to(cursor, { scale: hovering ? 1.12 : 1, duration: reducedMotion ? 0 : 0.18, ease: "power2.out", overwrite: "auto" });
      }
    }

    function onDown() { gsap.to(cursor, { scale: 0.8, duration: reducedMotion ? 0 : 0.1 }); }
    function onUp() { gsap.to(cursor, { scale: interactive ? 1.12 : 1, duration: reducedMotion ? 0 : 0.18 }); }
    function onLeave() { visible = false; gsap.to(cursor, { opacity: 0, duration: 0.12, overwrite: "auto" }); }

    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(cursor);
    };
  }, []);

  return <div className="custom-cursor" ref={cursorRef} aria-hidden="true"><svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 2.5V19.5L7.5 15.2L11 23L14.3 21.5L10.7 13.8L19.5 12.3L2.5 2.5Z" fill="#C3F677" stroke="#101410" strokeWidth="2.5" strokeLinejoin="round" /><path d="M2.5 2.5L19.5 12.3L10.7 13.8" stroke="#A2D76D" strokeWidth="0.8" strokeLinejoin="round" /></svg></div>;
}
