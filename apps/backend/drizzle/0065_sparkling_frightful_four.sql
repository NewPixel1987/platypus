ALTER TABLE "skill" ADD COLUMN "disable_model_invocation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "skill" ADD COLUMN "argument_hint" text;
