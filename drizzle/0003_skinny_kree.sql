DROP INDEX "game_participant_idx";--> statement-breakpoint
DROP INDEX "score_game_user_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "game_participant_idx" ON "game_participants" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "score_game_user_idx" ON "scores" USING btree ("game_id","user_id");