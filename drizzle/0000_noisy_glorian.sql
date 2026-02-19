CREATE TABLE "game_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(21) NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"question_order" jsonb NOT NULL,
	"question_start_time" timestamp with time zone,
	"phase" varchar(20) DEFAULT 'waiting' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_states_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "player_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(21) NOT NULL,
	"user_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer_index" integer,
	"is_correct" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"answers" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(21) NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"admin_id" integer NOT NULL,
	"participant_limit" integer DEFAULT 6 NOT NULL,
	"status" varchar(20) DEFAULT 'closed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(21) NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'candidate' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "game_states" ADD CONSTRAINT "game_states_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_answers" ADD CONSTRAINT "player_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_state_room_idx" ON "game_states" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "answer_room_question_idx" ON "player_answers" USING btree ("room_id","question_id");--> statement-breakpoint
CREATE INDEX "answer_room_user_question_idx" ON "player_answers" USING btree ("room_id","user_id","question_id");--> statement-breakpoint
CREATE INDEX "question_category_idx" ON "questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "question_difficulty_idx" ON "questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "room_participant_idx" ON "room_participants" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "room_admin_id_idx" ON "rooms" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "room_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "score_room_user_idx" ON "scores" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");