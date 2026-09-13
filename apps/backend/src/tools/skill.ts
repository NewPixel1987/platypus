import { tool } from "ai";
import { z } from "zod";
import { db } from "../index.ts";
import { resolveScopedByName } from "../services/scoped-resource.ts";

export const createLoadSkillTool = (
  orgId: string,
  workspaceId: string,
  permittedSkillIds: string[],
) => {
  const permitted = new Set(permittedSkillIds);

  return tool({
    description:
      "Load the full content of a skill by name. Use this when a user request relates to one of the available skills.",
    inputSchema: z.object({
      name: z.string().describe("The kebab-case name of the skill to load"),
    }),
    execute: async ({ name }: { name: string }) => {
      // The Skill of this name visible here: the workspace-scoped one, or the
      // org-scoped (Shared) one where attached to this workspace (ADR-0007).
      let found = await resolveScopedByName(db, "skill", name, {
        orgId,
        workspaceId,
      });

      // Name resolution normally prefers the Workspace row. If that row is not
      // assigned, retry within the permitted ids so an assigned Shared Skill
      // with the same name remains loadable.
      const shadowedByUnassigned = found && !permitted.has(found.row.id);
      if (shadowedByUnassigned) {
        found = await resolveScopedByName(
          db,
          "skill",
          name,
          { orgId, workspaceId },
          permittedSkillIds,
        );
        if (!found) {
          return {
            error: `Skill '${name}' is not assigned to this agent`,
          };
        }
      }

      if (
        !found ||
        !permitted.has(found.row.id) ||
        found.row.disableModelInvocation
      ) {
        if (found && !permitted.has(found.row.id)) {
          return {
            error: `Skill '${name}' is not assigned to this agent`,
          };
        }
        if (found?.row.disableModelInvocation) {
          return {
            error: `Skill '${name}' can only be invoked by a user`,
          };
        }
        return { error: `Skill '${name}' not found` };
      }

      return { name: found.row.name, body: found.row.body };
    },
  });
};
