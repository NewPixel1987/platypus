CREATE TABLE "trigger_run_event" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"parent_event_id" text,
	"seq" integer NOT NULL,
	"type" text NOT NULL,
	"tool_name" text,
	"started_at" bigint NOT NULL,
	"duration_ms" integer,
	"status" text NOT NULL,
	"error" jsonb,
	"children_truncated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trigger_run" ADD COLUMN "final_text" text;--> statement-breakpoint
ALTER TABLE "trigger_run" ADD COLUMN "events_truncated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trigger_run_event" ADD CONSTRAINT "trigger_run_event_run_id_trigger_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."trigger_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_run_event" ADD CONSTRAINT "trigger_run_event_parent_event_id_trigger_run_event_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."trigger_run_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_trigger_run_event_run_id_seq" ON "trigger_run_event" USING btree ("run_id","seq");