import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetMockDb } from "../test-utils.ts";

import { createLoadSkillTool } from "./skill.ts";

const ctx = { toolCallId: "test", messages: [], context: {} };

describe("createLoadSkillTool", () => {
  const orgId = "org-1";
  const workspaceId = "ws-1";
  let loadSkill: ReturnType<typeof createLoadSkillTool>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockDb();
    loadSkill = createLoadSkillTool(orgId, workspaceId, ["s1"]);
  });

  it("returns a tool with the correct description", () => {
    expect(loadSkill.description).toContain("skill");
  });

  it("returns workspace skill data when found", async () => {
    const skillData = {
      id: "s1",
      name: "my-skill",
      body: "Skill instructions here",
      disableModelInvocation: false,
    };
    // First query (workspace-scoped) resolves with the skill.
    mockDb.limit.mockResolvedValueOnce([skillData]);

    expect(await loadSkill.execute({ name: "my-skill" }, ctx)).toEqual({
      name: "my-skill",
      body: "Skill instructions here",
    });
  });

  it("falls back to an attached org-scoped skill", async () => {
    const orgSkill = {
      id: "s1",
      name: "shared-skill",
      body: "Shared instructions",
      organizationId: "org-1",
      workspaceId: null,
      disableModelInvocation: false,
    };
    mockDb.limit
      .mockResolvedValueOnce([]) // no workspace-scoped skill of this name
      .mockResolvedValueOnce([orgSkill]) // the Shared skill
      .mockResolvedValueOnce([{ id: "att-1" }]); // attached to this workspace

    expect(await loadSkill.execute({ name: "shared-skill" }, ctx)).toEqual({
      name: "shared-skill",
      body: "Shared instructions",
    });
  });

  it("refuses an org-scoped skill that is not attached here", async () => {
    mockDb.limit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "s2",
          name: "shared-skill",
          body: "Shared instructions",
          organizationId: "org-1",
          workspaceId: null,
        },
      ])
      .mockResolvedValueOnce([]); // no attachment → not visible here

    expect(await loadSkill.execute({ name: "shared-skill" }, ctx)).toEqual({
      error: "Skill 'shared-skill' not found",
    });
  });

  it("returns error when skill not found at either scope", async () => {
    mockDb.limit.mockResolvedValue([]);

    expect(await loadSkill.execute({ name: "nonexistent" }, ctx)).toEqual({
      error: "Skill 'nonexistent' not found",
    });
  });

  it("loads an assigned Shared Skill when an unassigned Workspace Skill shadows its name", async () => {
    mockDb.limit
      .mockResolvedValueOnce([
        {
          id: "shadow",
          name: "shared-name",
          body: "The unassigned workspace version",
          workspaceId: "ws-1",
          disableModelInvocation: false,
        },
      ])
      .mockResolvedValueOnce([]) // shadow is excluded by the permitted ids
      .mockResolvedValueOnce([
        {
          id: "s1",
          name: "shared-name",
          body: "The assigned Shared version",
          organizationId: "org-1",
          workspaceId: null,
          disableModelInvocation: false,
        },
      ])
      .mockResolvedValueOnce([{ id: "att-1" }]);

    expect(await loadSkill.execute({ name: "shared-name" }, ctx)).toEqual({
      name: "shared-name",
      body: "The assigned Shared version",
    });
  });

  it("refuses a skill that is not assigned to the running Agent", async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "unassigned",
        name: "unassigned-skill",
        body: "Instructions for an unassigned skill",
        disableModelInvocation: false,
      },
    ]);

    expect(await loadSkill.execute({ name: "unassigned-skill" }, ctx)).toEqual({
      error: "Skill 'unassigned-skill' is not assigned to this agent",
    });
  });

  it("refuses a user-invocable-only skill from the model", async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "s1",
        name: "human-only",
        body: "Instructions reserved for direct user invocation",
        disableModelInvocation: true,
      },
    ]);

    expect(await loadSkill.execute({ name: "human-only" }, ctx)).toEqual({
      error: "Skill 'human-only' can only be invoked by a user",
    });
  });
});
