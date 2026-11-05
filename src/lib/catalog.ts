// What the practice app offers (instruments, scales, effects, limits) comes from the database.

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, appSettings, effects, instruments, scales } from "@/db";
import type { Instrument, ScalePreset } from "./music";

export const CATALOG_TAG = "catalog";

export interface EffectDef {
  id: string;
  labelKey: string;
  defaultAmount: number;
}

export interface Catalog {
  instruments: Instrument[];
  scales: ScalePreset[];
  effects: EffectDef[];
  settings: {
    bpmMin: number;
    bpmMax: number;
    bpmDefault: number;
    defaultScale: string;
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const [ins, sc, fx, st] = await Promise.all([
    db.select().from(instruments).orderBy(asc(instruments.sort)),
    db.select().from(scales).where(eq(scales.enabled, true)).orderBy(asc(scales.sort)),
    db.select().from(effects).where(eq(effects.enabled, true)).orderBy(asc(effects.sort)),
    db.select().from(appSettings),
  ]);
  const settings = Object.fromEntries(st.map((r) => [r.key, r.value]));
  return {
    instruments: ins.map((i) => ({
      id: i.id,
      labelKey: i.labelKey,
      available: i.available,
      tuning: i.tuning,
      stringNames: i.stringNames,
      image: i.image,
      imageCredit: i.imageCredit,
    })),
    scales: sc.map((s) => ({
      id: s.id,
      instrumentId: s.instrumentId,
      labelKey: s.labelKey,
      rootPc: s.rootPc,
      intervals: s.intervals,
      startFret: s.startFret,
    })),
    effects: fx.map((e) => ({ id: e.id, labelKey: e.labelKey, defaultAmount: e.defaultAmount })),
    settings: {
      bpmMin: num(settings["lesson.bpmMin"], 40),
      bpmMax: num(settings["lesson.bpmMax"], 160),
      bpmDefault: num(settings["lesson.bpmDefault"], 80),
      defaultScale: typeof settings["lesson.defaultScale"] === "string" ? (settings["lesson.defaultScale"] as string) : "",
    },
  };
}
