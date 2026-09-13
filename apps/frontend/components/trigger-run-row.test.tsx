import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TriggerRunWithTrigger } from "@platypus/schemas";
import { TriggerRunRow, triggerRunDetailHref } from "./trigger-run-row";

const run = (
  over: Partial<TriggerRunWithTrigger> = {},
): TriggerRunWithTrigger => ({
  id: "run-1",
  triggerId: "trigger-1",
  triggerName: "Nightly digest",
  status: "success",
  eventType: null,
  eventData: null,
  startedAt: new Date("2026-01-01T09:00:00Z"),
  completedAt: new Date("2026-01-01T09:00:10Z"),
  errorMessage: null,
  stats: null,
  createdAt: new Date("2026-01-01T09:00:00Z"),
  ...over,
});

describe("TriggerRunRow", () => {
  it("links to the run's own page", () => {
    render(<TriggerRunRow run={run()} orgId="org-1" workspaceId="ws-1" />);

    expect(screen.getByLabelText("View run")).toHaveAttribute(
      "href",
      triggerRunDetailHref("org-1", "ws-1", "run-1"),
    );
    expect(triggerRunDetailHref("org-1", "ws-1", "run-1")).toBe(
      "/org-1/workspace/ws-1/trigger-runs/run-1",
    );
  });

  it("offers no page for a suppressed firing, which never ran", () => {
    render(
      <TriggerRunRow
        run={run({ status: "suppressed" })}
        orgId="org-1"
        workspaceId="ws-1"
      />,
    );

    expect(screen.queryByLabelText("View run")).not.toBeInTheDocument();
  });

  it("hides the link when told it is already on the run's page", () => {
    render(
      <TriggerRunRow
        run={run()}
        orgId="org-1"
        workspaceId="ws-1"
        linkToDetail={false}
      />,
    );

    expect(screen.queryByLabelText("View run")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Copy run id")).toBeInTheDocument();
  });

  // #647: someone stopped it, nothing faulted — so it is not drawn as a failure.
  it("labels a cancelled run Cancelled, without an error", () => {
    render(
      <TriggerRunRow
        run={run({ status: "cancelled", errorMessage: null })}
        orgId="org-1"
        workspaceId="ws-1"
      />,
    );

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
  });
});
