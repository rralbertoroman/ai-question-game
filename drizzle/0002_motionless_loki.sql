-- Add last_active_at to users
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp;
--> statement-breakpoint
-- Create games table
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(20) DEFAULT 'playing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create game_participants table
CREATE TABLE "game_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Clean reset: truncate tables that reference rooms
TRUNCATE TABLE "scores" CASCADE;
--> statement-breakpoint
TRUNCATE TABLE "player_answers" CASCADE;
--> statement-breakpoint
TRUNCATE TABLE "game_states" CASCADE;
--> statement-breakpoint
-- game_states: drop old room_id constraints, column, and index
ALTER TABLE "game_states" DROP CONSTRAINT "game_states_room_id_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "game_states" DROP CONSTRAINT "game_states_room_id_unique";
--> statement-breakpoint
DROP INDEX "game_state_room_idx";
--> statement-breakpoint
ALTER TABLE "game_states" DROP COLUMN "room_id";
--> statement-breakpoint
ALTER TABLE "game_states" ADD COLUMN "game_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "game_states" ADD CONSTRAINT "game_states_game_id_unique" UNIQUE("game_id");
--> statement-breakpoint
ALTER TABLE "game_states" ADD CONSTRAINT "game_states_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_states" ALTER COLUMN "phase" SET DEFAULT 'question';
--> statement-breakpoint
-- player_answers: drop old room_id constraints, column, and indexes
ALTER TABLE "player_answers" DROP CONSTRAINT "player_answers_room_id_rooms_id_fk";
--> statement-breakpoint
DROP INDEX "answer_room_question_idx";
--> statement-breakpoint
DROP INDEX "answer_room_user_question_idx";
--> statement-breakpoint
ALTER TABLE "player_answers" DROP COLUMN "room_id";
--> statement-breakpoint
ALTER TABLE "player_answers" ADD COLUMN "game_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- scores: drop old room_id constraints, column, and index
ALTER TABLE "scores" DROP CONSTRAINT "scores_room_id_rooms_id_fk";
--> statement-breakpoint
DROP INDEX "score_room_user_idx";
--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "room_id";
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "game_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Drop old room tables (room_participants first due to FK on rooms)
DROP TABLE "room_participants";
--> statement-breakpoint
DROP TABLE "rooms";
--> statement-breakpoint
-- Create new indexes
CREATE INDEX "game_status_idx" ON "games" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "game_participant_idx" ON "game_participants" USING btree ("game_id","user_id");
--> statement-breakpoint
CREATE INDEX "game_state_game_idx" ON "game_states" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX "answer_game_question_idx" ON "player_answers" USING btree ("game_id","question_id");
--> statement-breakpoint
CREATE INDEX "answer_game_user_question_idx" ON "player_answers" USING btree ("game_id","user_id","question_id");
--> statement-breakpoint
CREATE INDEX "score_game_user_idx" ON "scores" USING btree ("game_id","user_id");
--> statement-breakpoint
-- Add FKs for game_participants
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
