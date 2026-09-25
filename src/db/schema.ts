import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  uniqueIndex,
  index,
  boolean,
  customType,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  level: varchar("level", { length: 50 }).notNull().default("All levels"),
  location: varchar("location", { length: 200 }).notNull(),
  host: varchar("host", { length: 120 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(90),
  capacity: integer("capacity").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvps = pgTable(
  "rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("rsvps_event_email_idx").on(t.eventId, t.email)],
);

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  level: varchar("level", { length: 50 }).notNull(),
  nativeLanguage: varchar("native_language", { length: 80 }),
  interests: text("interests"),
  goals: text("goals"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 80 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(),
  content: varchar("content", { length: 280 }).notNull(),
  meaning: varchar("meaning", { length: 400 }),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ================= Accounts & gamification ================= */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  displayName: varchar("display_name", { length: 60 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarColor: varchar("avatar_color", { length: 20 }).notNull().default("#b8322a"),
  country: varchar("country", { length: 60 }),
  level: varchar("level", { length: 50 }),
  bio: varchar("bio", { length: 280 }),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: varchar("last_active_date", { length: 10 }),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    token: varchar("token", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_exp_idx").on(t.expiresAt)],
);

export const xpLog = pgTable(
  "xp_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activity: varchar("activity", { length: 40 }).notNull(),
    amount: integer("amount").notNull(),
    meta: varchar("meta", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("xp_log_user_idx").on(t.userId, t.createdAt)],
);

/* ================= Chat ================= */
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  description: varchar("description", { length: 200 }).notNull().default(""),
  emoji: varchar("emoji", { length: 8 }).notNull().default("💬"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    channelId: integer("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 1000 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_channel_idx").on(t.channelId, t.id)],
);

/* ================= Blog ================= */
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  excerpt: varchar("excerpt", { length: 400 }).notNull().default(""),
  content: text("content").notNull(),
  coverImage: varchar("cover_image", { length: 300 }),
  tags: varchar("tags", { length: 200 }).notNull().default(""),
  author: varchar("author", { length: 80 }).notNull().default("Gelan English Club"),
  published: boolean("published").notNull().default(true),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ================= Meetings (WebRTC signaling) ================= */
export const meetRooms = pgTable("meet_rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  hostName: varchar("host_name", { length: 60 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetPeers = pgTable("meet_peers", {
  id: varchar("id", { length: 40 }).primaryKey(),
  roomCode: varchar("room_code", { length: 20 }).notNull(),
  name: varchar("name", { length: 60 }).notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
});

export const meetSignals = pgTable(
  "meet_signals",
  {
    id: serial("id").primaryKey(),
    roomCode: varchar("room_code", { length: 20 }).notNull(),
    fromPeer: varchar("from_peer", { length: 40 }).notNull(),
    toPeer: varchar("to_peer", { length: 40 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    payload: text("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meet_signals_room_idx").on(t.roomCode, t.id)],
);

/* ================= About: team, champions, history, livestreams ================= */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  group: varchar("group", { length: 20 }).notNull().default("facilitator"), // leader | facilitator
  bio: text("bio").notNull().default(""),
  quote: varchar("quote", { length: 280 }),
  country: varchar("country", { length: 60 }),
  photoUrl: text("photo_url"),
  specialties: varchar("specialties", { length: 300 }).notNull().default(""),
  joinedYear: integer("joined_year"),
  color: varchar("color", { length: 20 }).notNull().default("#b8322a"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const champions = pgTable("champions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  award: varchar("award", { length: 140 }).notNull(),
  competition: varchar("competition", { length: 160 }).notNull(),
  category: varchar("category", { length: 30 }).notNull().default("debate"),
  place: integer("place").notNull().default(1),
  season: varchar("season", { length: 40 }).notNull().default(""),
  year: integer("year").notNull(),
  country: varchar("country", { length: 60 }),
  photoUrl: text("photo_url"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  month: varchar("month", { length: 12 }),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  icon: varchar("icon", { length: 8 }).notNull().default("⭐"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  streamUrl: text("stream_url").notNull().default(""),
  status: varchar("status", { length: 12 }).notNull().default("scheduled"), // scheduled | live | ended
  host: varchar("host", { length: 100 }).notNull().default("Gelan English Club"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ================= Announcements & notifications ================= */
export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 20 }).notNull().default("news"), // news | event | urgent | update | celebration
    pinned: boolean("pinned").notNull().default(false),
    showBanner: boolean("show_banner").notNull().default(false),
    published: boolean("published").notNull().default(true),
    linkUrl: varchar("link_url", { length: 300 }),
    linkLabel: varchar("link_label", { length: 60 }),
    author: varchar("author", { length: 80 }).notNull().default("Gelan English Club"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("announcements_pub_idx").on(t.published, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 30 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: varchar("body", { length: 500 }).notNull().default(""),
    href: varchar("href", { length: 300 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.read, t.createdAt)],
);

/* ================= Submissions & verification ================= */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const submissionFiles = pgTable("submission_files", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 200 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: integer("group_id").references(() => studyGroups.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 30 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    textContent: text("text_content"),
    fileId: integer("file_id").references(() => submissionFiles.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | declined
    feedback: text("feedback"),
    score: integer("score"),
    reviewedBy: varchar("reviewed_by", { length: 80 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    verificationCode: varchar("verification_code", { length: 20 }).unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("submissions_status_idx").on(t.status, t.createdAt), index("submissions_user_idx").on(t.userId, t.createdAt)],
);

/* ================= Study groups ================= */
export const studyGroups = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  description: text("description").notNull().default(""),
  challenge: text("challenge"),
  emoji: varchar("emoji", { length: 8 }).notNull().default("👥"),
  color: varchar("color", { length: 20 }).notNull().default("#b8322a"),
  level: varchar("level", { length: 40 }).notNull().default("All levels"),
  schedule: varchar("schedule", { length: 120 }),
  joinPolicy: varchar("join_policy", { length: 12 }).notNull().default("open"), // open | approval
  maxMembers: integer("max_members").notNull().default(200),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => studyGroups.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 12 }).notNull().default("member"), // member | moderator
    status: varchar("status", { length: 12 }).notNull().default("active"), // active | pending
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("group_members_uniq").on(t.groupId, t.userId), index("group_members_user_idx").on(t.userId)],
);

export const groupPosts = pgTable(
  "group_posts",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => studyGroups.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 1500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("group_posts_group_idx").on(t.groupId, t.createdAt)],
);

/* ================= Games ================= */
export const gameScores = pgTable(
  "game_scores",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    game: varchar("game", { length: 20 }).notNull(),
    score: integer("score").notNull(),
    timeMs: integer("time_ms").notNull().default(0),
    meta: varchar("meta", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_scores_game_idx").on(t.game, t.score)],
);

export type Announcement = typeof announcements.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Champion = typeof champions.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Livestream = typeof livestreams.$inferSelect;
export type User = typeof users.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Message = typeof messages.$inferSelect;
