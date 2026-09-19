"use client";

import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Dims the sidebar behind a panel that opens over it.
 *
 * On a phone the workspace switcher's menu drops over the sidebar rather than
 * beside it, and the two surfaces are near-identical colours, so without a
 * scrim the menu's edges are hard to make out. Render this as a child of the
 * sidebar: the menu itself is portalled to the body and so stays above it.
 *
 * The scrim stays mounted and fades, rather than unmounting on close, so the
 * sidebar does not snap back to full brightness while the menu is still
 * fading out.
 */
export function SidebarScrim({ open }: { open: boolean }) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div
      data-slot="sidebar-scrim"
      data-state={open ? "open" : "closed"}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
    />
  );
}
