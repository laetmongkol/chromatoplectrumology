// How points are earned. Kept out of the server-actions file, which may only export async functions.

/** Points for a finished run: a twentieth of the score, plus a bonus for accuracy, capped so one run cannot dominate. */
export const runPoints = (score: number, accuracy: number) => Math.min(500, Math.round(score / 20) + (accuracy >= 90 ? 25 : accuracy >= 75 ? 10 : 0));

/** Points for "I practiced this song" (once per song per day). */
export const SONG_POINTS = 15;

/** Points needed for each level. */
export const POINTS_PER_LEVEL = 500;
