// Database schema. Everything the UI shows or the lessons use lives here, so the admin page can change it.
// Keep imports relative-free (only drizzle) so scripts can load this file directly with Node.

import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

// ---------- i18n ----------

export const languages = pgTable("languages", {
  code: text("code").primaryKey(), // e.g. "th", "en", "zh-CN"
  slug: text("slug").unique(), // URL prefix, e.g. "jp" for ja. Falls back to the lowercase code.
  flag: text("flag"), // ISO 3166 country code for the flag icon, e.g. "jp"
  nativeName: text("native_name").notNull(),
  englishName: text("english_name").notNull(),
  rtl: boolean("rtl").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const translationKeys = pgTable("translation_keys", {
  key: text("key").primaryKey(), // e.g. "landing.hero.title"
  namespace: text("namespace").notNull(), // first segment, used for filtering in admin
  description: text("description"),
});

export const translations = pgTable(
  "translations",
  {
    key: text("key")
      .notNull()
      .references(() => translationKeys.key, { onDelete: "cascade", onUpdate: "cascade" }),
    lang: text("lang")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade", onUpdate: "cascade" }),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.key, t.lang] })],
);

// ---------- catalog: what the practice app offers ----------

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  description: text("description"),
});

export const instruments = pgTable("instruments", {
  id: text("id").primaryKey(),
  labelKey: text("label_key").notNull(),
  available: boolean("available").notNull().default(false),
  /** MIDI note of each open string, lowest first. */
  tuning: jsonb("tuning").$type<number[]>().notNull().default([]),
  stringNames: jsonb("string_names").$type<string[]>().notNull().default([]),
  /** Photo shown on the instrument picker, a path under /public such as /images/instruments/guitar.jpg */
  image: text("image"),
  /** Photographer / source line, shown in the picker footer */
  imageCredit: text("image_credit"),
  sort: integer("sort").notNull().default(0),
});

/** Photos used on the marketing pages (landing, features, how it works). The code asks for them by key. */
export const media = pgTable("media", {
  key: text("key").primaryKey(),
  /** Path under /public, e.g. /images/landing/pedals.jpg */
  path: text("path").notNull(),
  /** Photographer, shown in the page footer */
  credit: text("credit"),
  sort: integer("sort").notNull().default(0),
});

export const scales = pgTable("scales", {
  id: text("id").primaryKey(),
  instrumentId: text("instrument_id")
    .notNull()
    .references(() => instruments.id, { onDelete: "cascade" }),
  labelKey: text("label_key").notNull(),
  rootPc: integer("root_pc").notNull(),
  intervals: jsonb("intervals").$type<number[]>().notNull(),
  startFret: integer("start_fret").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const effects = pgTable("effects", {
  id: text("id").primaryKey(),
  labelKey: text("label_key").notNull(),
  defaultAmount: integer("default_amount").notNull().default(50),
  enabled: boolean("enabled").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

// ---------- auth (Better Auth) ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"), // "user" | "admin"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- practice history and preferences ----------

/** One finished practice run, saved when a signed-in player stops. Numbers come from the browser, so the server checks their range. */
export const plays = pgTable(
  "plays",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    instrumentId: text("instrument_id").notNull(),
    scaleId: text("scale_id").notNull(),
    mode: text("mode").notNull(), // "beat" | "free"
    bpm: integer("bpm").notNull(),
    score: integer("score").notNull(),
    bestCombo: integer("best_combo").notNull(),
    accuracy: integer("accuracy").notNull(), // 0-100
    hits: integer("hits").notNull(),
    total: integer("total").notNull(),
    seconds: integer("seconds").notNull(),
    /** The player's local calendar day (YYYY-MM-DD), so streaks follow their own midnight, not the server's. */
    day: text("day").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("plays_user_idx").on(t.userId, t.createdAt), index("plays_board_idx").on(t.instrumentId, t.scaleId, t.score)],
);

export const userPrefs = pgTable("user_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Minutes of practice the player wants each day. */
  dailyGoalMin: integer("daily_goal_min").notNull().default(15),
  /** Whether the player's name appears on the leaderboard. */
  showOnBoard: boolean("show_on_board").notNull().default(true),
});

// ---------- songs (chord sheets) and points ----------

/** Chord sheets an admin pastes in. `body` is plain text: section titles, chord lines (bars and chords) and lyric lines. */
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  /** Original key, shown on the sheet, e.g. "Bb" */
  songKey: text("song_key").notNull().default(""),
  bpm: integer("bpm"),
  /** Beats in each bar (the top number of the time signature). A bar with one chord holds it for all of them; two chords share it. */
  beatsPerBar: integer("beats_per_bar").notNull().default(4),
  body: text("body").notNull().default(""),
  /** Optional hand-written easy version of the same song. When empty, easy chords are made from `body` automatically. */
  bodyEasy: text("body_easy").notNull().default(""),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Every point a player earns, one row each, so the total can always be explained. */
export const pointEvents = pgTable(
  "point_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // "run" | "song"
    /** What the points are for: a play id for runs, a song id for songs */
    refId: integer("ref_id").notNull(),
    points: integer("points").notNull(),
    /** Player's local day, so "once per song per day" follows their own midnight */
    day: text("day").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("points_user_idx").on(t.userId, t.kind, t.refId, t.day)],
);

/** A different chord sheet of a song for one instrument (guitar chords, bass line, keys ...). The song's own `body` is the default for every instrument without its own sheet. */
export const songSheets = pgTable(
  "song_sheets",
  {
    id: serial("id").primaryKey(),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    instrumentId: text("instrument_id").notNull(),
    body: text("body").notNull().default(""),
    bodyEasy: text("body_easy").notNull().default(""),
  },
  (t) => [unique("song_sheets_song_instrument").on(t.songId, t.instrumentId)],
);
