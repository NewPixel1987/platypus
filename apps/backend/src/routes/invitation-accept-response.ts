import type { Context } from "hono";
import type { AcceptInvitationResult } from "../services/invitation-accept.ts";

/**
 * The HTTP response for an accept outcome, stated once for every route that
 * accepts an invitation. A successful accept reports the Organization and the
 * freshly provisioned Workspace, so a caller can land the new member there
 * rather than guessing where they belong.
 */
export function acceptResultResponse(
  c: Context,
  result: AcceptInvitationResult,
) {
  switch (result.outcome) {
    case "not_found":
      return c.json(
        { error: "Invitation not found or already processed" },
        404,
      );
    case "expired":
      return c.json({ error: "Invitation has expired" }, 410);
    case "accepted":
      return c.json({
        message: "Invitation accepted",
        organizationId: result.organizationId,
        workspaceId: result.workspaceId,
      });
  }
}
