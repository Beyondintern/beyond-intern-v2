"use client";

/**
 * Spotlight interaction helpers.
 *
 * Writes cursor position straight to CSS custom properties on the element
 * (no React state), so the .spotlight-card pseudo-elements can render a
 * cursor-tracked glow without re-rendering the component tree on every
 * pointer move. Attach via onPointerMove={trackSpotlight}.
 */
export function trackSpotlight(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}
