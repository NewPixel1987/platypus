import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/pg-core";
import { triggerRun, triggerRunEvent } from "./schema.ts";

/**
 * "Deleting a Trigger run removes its events; Max Runs to Keep retention
 * leaves no orphaned events" (#647). Retention deletes run rows and nothing
 * else, so the whole of that guarantee is the cascade on the foreign key — in
 * the schema the code reads, and in the migration production applies. Both
 * are pinned here, since neither is exercised against a live database in
 * this suite.
 */
describe("trigger_run_event cascades from its run", () => {
  const foreignKeyTo = (table: string) =>
    getTableConfig(triggerRunEvent).foreignKeys.find(
      (fk) => getTableConfig(fk.reference().foreignTable).name === table,
    );

  it("keys every event to the root run, deleting with it", () => {
    const toRun = foreignKeyTo("trigger_run");
    expect(toRun).toBeDefined();
    expect(toRun?.reference().columns.map((c) => c.name)).toEqual(["run_id"]);
    expect(toRun?.reference().foreignColumns.map((c) => c.name)).toEqual([
      triggerRun.id.name,
    ]);
    expect(toRun?.onDelete).toBe("cascade");
  });

  it("cascades a delegate's children with the delegate event", () => {
    const self = foreignKeyTo("trigger_run_event");
    expect(self?.reference().columns.map((c) => c.name)).toEqual([
      "parent_event_id",
    ]);
    expect(self?.onDelete).toBe("cascade");
  });

  it("ships the same cascade in the migration production applies", () => {
    const migration = readFileSync(
      new URL("../../drizzle/0066_trigger_run_events.sql", import.meta.url),
      "utf8",
    );
    expect(migration).toMatch(
      /FOREIGN KEY \("run_id"\) REFERENCES "public"\."trigger_run"\("id"\) ON DELETE cascade/,
    );
    expect(migration).toMatch(
      /FOREIGN KEY \("parent_event_id"\) REFERENCES "public"\."trigger_run_event"\("id"\) ON DELETE cascade/,
    );
  });
});
