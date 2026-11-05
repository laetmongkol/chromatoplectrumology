// Photos for the marketing pages come from the database (media + instruments tables), so an admin can swap them.

import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, instruments, media } from "@/db";
import { CATALOG_TAG } from "./catalog";

export interface Photo {
  key: string;
  path: string;
  credit: string | null;
}

/** Every photo in display order: the instrument photos first, then the extra landing photos. */
export async function getPhotos(): Promise<Photo[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const [ins, extra] = await Promise.all([db.select().from(instruments).orderBy(asc(instruments.sort)), db.select().from(media).orderBy(asc(media.sort))]);
  const fromInstruments = ins.filter((i) => i.image).map((i) => ({ key: i.id, path: i.image as string, credit: i.imageCredit }));
  return [...fromInstruments, ...extra.map((m) => ({ key: m.key, path: m.path, credit: m.credit }))];
}

export function photoByKey(photos: Photo[], key: string): Photo | undefined {
  return photos.find((p) => p.key === key);
}

export function creditLine(photos: Photo[]): string[] {
  return [...new Set(photos.map((p) => p.credit).filter((c): c is string => !!c))];
}
