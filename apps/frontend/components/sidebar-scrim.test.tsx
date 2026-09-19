import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { SidebarScrim } from "./sidebar-scrim";

const isMobile = vi.hoisted(() => ({ value: true }));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile.value,
}));

describe("SidebarScrim", () => {
  beforeEach(() => {
    isMobile.value = true;
  });

  it("dims the sidebar behind an open panel on a phone", () => {
    const { container } = render(<SidebarScrim open />);

    const scrim = container.querySelector('[data-slot="sidebar-scrim"]');
    expect(scrim).toHaveAttribute("data-state", "open");
    expect(scrim).toHaveAttribute("aria-hidden", "true");
  });

  // Kept mounted so it can fade out with the closing panel rather than
  // snapping the sidebar back to full brightness.
  it("leaves the sidebar undimmed while the panel is closed", () => {
    const { container } = render(<SidebarScrim open={false} />);

    const scrim = container.querySelector('[data-slot="sidebar-scrim"]');
    expect(scrim).toHaveAttribute("data-state", "closed");
  });

  // On a wider viewport the panel opens beside the sidebar rather than over
  // it, so there is nothing behind it to dim.
  it("renders nothing off a phone", () => {
    isMobile.value = false;

    const { container } = render(<SidebarScrim open />);

    expect(container).toBeEmptyDOMElement();
  });
});
