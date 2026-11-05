// Practice game state. Pure logic: no DOM, no audio. Judges detected pitch against the notes crossing the hit line.

import type { Pos } from "./music";

export const STAGE_W = 1078;
export const STAGE_H = 300;
export const HIT_X = 120;
const WIN_LEFT = 70;
const WIN_RIGHT = 175;

export type Mode = "beat" | "free";

/** Seconds from pressing Start until the first note reaches the hit line (first spawn delay + travel time). The metronome's first click lands here. */
export function firstArrivalSeconds(bpm: number): number {
  const speed = 260 * (bpm / 80);
  return 0.4 + (STAGE_W + 20 - HIT_X) / speed;
}

export interface GNote extends Pos {
  x: number;
  state: "pending" | "hit" | "miss";
}

export type GameEvent = { type: "hit"; note: GNote; combo: number } | { type: "miss"; note: GNote };

export interface HeardPitch {
  midi: number;
  clarity: number;
}

export class Game {
  notes: GNote[] = [];
  score = 0;
  combo = 0;
  best = 0;
  hits = 0;
  total = 0;
  running = false;
  mode: Mode = "beat";
  bpm = 80;
  private seq: Pos[] = [];
  private idx = 0;
  private spawnIn = 0;
  private lastHitMidi = -1;
  private released = true;

  setSequence(seq: Pos[]) {
    this.seq = seq;
    this.reset();
  }

  reset() {
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.best = 0;
    this.hits = 0;
    this.total = 0;
    this.idx = 0;
    this.spawnIn = 0.4;
    this.lastHitMidi = -1;
    this.released = true;
  }

  get accuracy(): number | null {
    return this.total === 0 ? null : Math.round((this.hits / this.total) * 100);
  }

  private spawn() {
    if (this.seq.length === 0) return;
    const p = this.seq[this.idx % this.seq.length];
    this.idx++;
    this.notes.push({ ...p, x: STAGE_W + 20, state: "pending" });
  }

  update(dt: number, heard: HeardPitch | null): GameEvent[] {
    const events: GameEvent[] = [];
    if (!this.running) return events;

    if (!heard) this.released = true;
    const speed = 260 * (this.bpm / 80);

    if (this.mode === "beat") {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.spawn();
        this.spawnIn += 60 / this.bpm;
      }
    } else if (!this.notes.some((n) => n.state === "pending")) {
      this.spawn();
    }

    for (const n of this.notes) {
      if (n.state === "pending") {
        if (this.mode === "free" && n.x <= HIT_X) n.x = HIT_X;
        else n.x -= speed * dt;

        const inWindow = n.x <= WIN_RIGHT && (this.mode === "free" || n.x >= WIN_LEFT);
        const retrigger = n.midi !== this.lastHitMidi || this.released;
        if (inWindow && heard && heard.clarity > 0.8 && retrigger && Math.abs(heard.midi - n.midi) < 0.6) {
          n.state = "hit";
          this.hits++;
          this.total++;
          this.combo++;
          this.best = Math.max(this.best, this.combo);
          this.score += 100 + this.combo * 5;
          this.lastHitMidi = n.midi;
          this.released = false;
          events.push({ type: "hit", note: n, combo: this.combo });
        } else if (this.mode === "beat" && n.x < WIN_LEFT) {
          n.state = "miss";
          this.total++;
          this.combo = 0;
          events.push({ type: "miss", note: n });
        }
      } else {
        n.x -= speed * dt;
      }
    }
    this.notes = this.notes.filter((n) => n.x > -30);
    return events;
  }
}
