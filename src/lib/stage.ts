// Canvas renderer for the note stage: liquid-light backdrop, string lanes, notes and hit impact (silent).
// Light theme = white stage with soft colour washes and dark notes. Dark theme = black stage with glowing washes and light notes.

import { HIT_X, STAGE_H, STAGE_W, type Game, type GameEvent, type GNote } from "./game";
import { pitchClassName } from "./music";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  color: string;
}
interface Ring {
  x: number;
  y: number;
  r: number;
  a: number;
}
interface Floater {
  x: number;
  y: number;
  a: number;
  text: string;
  big: boolean;
  dim: boolean;
}

const LANE_TOP = 34;
const LANE_GAP = 46;

export function laneY(stringIndex: number, stringCount: number): number {
  return LANE_TOP + (stringCount - 1 - stringIndex) * LANE_GAP;
}

export interface StageLabels {
  good: string;
  perfect: string;
  miss: string;
  combo: (n: number) => string;
}

interface Palette {
  /** colour washes: [x position 0..1, "r,g,b", alpha] */
  blobs: [number, string, number][];
  lane: string;
  laneLabel: string;
  hitLine: string;
  /** note disc and its number */
  note: string;
  noteText: string;
  text: string;
  textDim: string;
  sparks: [string, string];
  missSpark: string;
  /** composite mode for sparks / rings / flash */
  blend: GlobalCompositeOperation;
  flashRgb: string;
}

const DARK: Palette = {
  blobs: [
    [0.2, "160,224,171", 0.7],
    [0.55, "255,172,46", 0.65],
    [0.9, "165,45,37", 0.75],
  ],
  lane: "rgba(255,255,255,.4)",
  laneLabel: "rgba(255,255,255,.8)",
  hitLine: "#fff",
  note: "#fff",
  noteText: "#000",
  text: "#fff",
  textDim: "rgba(255,255,255,.7)",
  sparks: ["255,255,255", "255,214,120"],
  missSpark: "120,120,120",
  blend: "lighter",
  flashRgb: "255,255,255",
};

const LIGHT: Palette = {
  blobs: [
    [0.2, "140,205,150", 0.7],
    [0.55, "255,178,70", 0.6],
    [0.9, "225,110,90", 0.5],
  ],
  lane: "rgba(0,0,0,.28)",
  laneLabel: "rgba(0,0,0,.65)",
  hitLine: "#000",
  note: "#000",
  noteText: "#fff",
  text: "#000",
  textDim: "rgba(0,0,0,.55)",
  sparks: ["0,0,0", "210,120,0"],
  missSpark: "150,150,150",
  blend: "source-over",
  flashRgb: "0,0,0",
};

export class StageRenderer {
  private parts: Particle[] = [];
  private rings: Ring[] = [];
  private floats: Floater[] = [];
  private flash = 0;
  private shake = 0;
  private t = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private stringNames: string[],
    private reduceMotion: boolean,
    private labels: () => StageLabels,
    private isDark: () => boolean,
  ) {}

  handle(events: GameEvent[]) {
    for (const e of events) {
      const y = laneY(e.note.string, this.stringNames.length);
      if (e.type === "hit") this.boom(y, e.combo);
      else this.miss(y);
    }
  }

  private pal(): Palette {
    return this.isDark() ? DARK : LIGHT;
  }

  private boom(y: number, combo: number) {
    const p = this.pal();
    this.flash = 1;
    this.shake = this.reduceMotion ? 0 : Math.min(9, 3 + combo * 0.35);
    const n = 18 + Math.min(combo, 20);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 2 + Math.random() * 8;
      this.parts.push({
        x: HIT_X,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 1,
        life: 1,
        r: 1 + Math.random() * 2.5,
        color: Math.random() < 0.5 ? p.sparks[0] : p.sparks[1],
      });
    }
    this.rings.push({ x: HIT_X, y, r: 14, a: 1 });
    if (combo % 5 === 0) this.rings.push({ x: HIT_X, y, r: 30, a: 1 });
    const milestone = combo > 0 && combo % 10 === 0;
    const L = this.labels();
    this.floats.push({
      x: HIT_X + 20,
      y: y - 28,
      a: 1,
      text: milestone ? L.combo(combo) : combo >= 5 ? L.perfect : L.good,
      big: milestone,
      dim: false,
    });
  }

  private miss(y: number) {
    const p = this.pal();
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1 + Math.random() * 3;
      this.parts.push({ x: HIT_X, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, r: 2, color: p.missSpark });
    }
    this.floats.push({ x: HIT_X + 20, y: y - 28, a: 0.8, text: this.labels().miss, big: false, dim: true });
  }

  draw(game: Game, showNames: boolean) {
    const cx = this.canvas.getContext("2d");
    if (!cx) return;
    const p = this.pal();
    this.t += 0.008;
    const W = STAGE_W;
    const H = STAGE_H;

    // Liquid-light backdrop on a transparent canvas, so the page's own background shows through.
    cx.clearRect(0, 0, W, H);
    p.blobs.forEach(([px, rgb, alpha], i) => {
      const x = W * px + Math.sin(this.t + i * 2) * 140;
      const y = H * 0.5 + Math.cos(this.t * 1.3 + i) * 70;
      const g = cx.createRadialGradient(x, y, 0, x, y, 330);
      g.addColorStop(0, `rgba(${rgb},${alpha})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
    });
    // Fade the washes out toward every edge (only the washes exist on the canvas at this point),
    // so the stage melts into the page instead of ending in a hard box.
    cx.globalCompositeOperation = "destination-in";
    const fadeX = cx.createLinearGradient(0, 0, W, 0);
    fadeX.addColorStop(0, "rgba(0,0,0,0)");
    fadeX.addColorStop(0.1, "rgba(0,0,0,1)");
    fadeX.addColorStop(0.9, "rgba(0,0,0,1)");
    fadeX.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = fadeX;
    cx.fillRect(0, 0, W, H);
    const fadeY = cx.createLinearGradient(0, 0, 0, H);
    fadeY.addColorStop(0, "rgba(0,0,0,0)");
    fadeY.addColorStop(0.18, "rgba(0,0,0,1)");
    fadeY.addColorStop(0.82, "rgba(0,0,0,1)");
    fadeY.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = fadeY;
    cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = "source-over";

    // lanes
    const count = this.stringNames.length;
    cx.font = "12px Inter, sans-serif";
    for (let s = 0; s < count; s++) {
      const y = laneY(s, count);
      cx.strokeStyle = p.lane;
      cx.lineWidth = 1;
      cx.beginPath();
      cx.moveTo(0, y);
      cx.lineTo(W, y);
      cx.stroke();
      cx.fillStyle = p.laneLabel;
      cx.fillText(this.stringNames[s], 14, y + 4);
    }
    cx.strokeStyle = p.hitLine;
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(HIT_X, 8);
    cx.lineTo(HIT_X, H - 8);
    cx.stroke();

    // notes
    for (const n of game.notes) this.drawNote(cx, p, n, count, showNames);
    this.drawImpact(cx, p);
  }

  private drawNote(cx: CanvasRenderingContext2D, p: Palette, n: GNote, count: number, showNames: boolean) {
    const y = laneY(n.string, count);
    const faded = n.state === "miss" || n.x < 70;
    cx.globalAlpha = faded ? 0.3 : 1;
    cx.fillStyle = p.note;
    cx.beginPath();
    cx.arc(n.x, y, n.root ? 19 : 17, 0, Math.PI * 2);
    cx.fill();
    if (n.root) {
      cx.strokeStyle = p.note;
      cx.lineWidth = 2;
      cx.beginPath();
      cx.arc(n.x, y, 23, 0, Math.PI * 2);
      cx.stroke();
    }
    cx.fillStyle = p.noteText;
    cx.font = "600 14px Inter, sans-serif";
    cx.textAlign = "center";
    cx.fillText(showNames ? pitchClassName(n.midi) : String(n.fret), n.x, y + 5);
    cx.textAlign = "left";
    cx.globalAlpha = 1;
  }

  private drawImpact(cx: CanvasRenderingContext2D, p: Palette) {
    cx.globalCompositeOperation = p.blend;
    if (this.flash > 0.02) {
      const peak = p.blend === "lighter" ? 0.6 : 0.22;
      const g = cx.createLinearGradient(80, 0, 160, 0);
      g.addColorStop(0, `rgba(${p.flashRgb},0)`);
      g.addColorStop(0.5, `rgba(${p.flashRgb},${this.flash * peak})`);
      g.addColorStop(1, `rgba(${p.flashRgb},0)`);
      cx.fillStyle = g;
      cx.fillRect(80, 0, 80, STAGE_H);
      this.flash *= 0.86;
    }
    for (const r of this.rings) {
      cx.strokeStyle = `rgba(${p.flashRgb},${r.a})`;
      cx.lineWidth = 2;
      cx.beginPath();
      cx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      cx.stroke();
      r.r += 5;
      r.a -= 0.045;
    }
    for (const q of this.parts) {
      cx.fillStyle = `rgba(${q.color},${Math.max(q.life, 0)})`;
      cx.beginPath();
      cx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      cx.fill();
      q.x += q.vx;
      q.y += q.vy;
      q.vy += 0.18;
      q.vx *= 0.98;
      q.life -= 0.028;
    }
    cx.globalCompositeOperation = "source-over";
    for (const f of this.floats) {
      cx.globalAlpha = Math.max(f.a, 0);
      cx.fillStyle = f.dim ? p.textDim : p.text;
      cx.font = `${f.big ? "600 22px" : "400 13px"} Inter, sans-serif`;
      cx.fillText(f.text, f.x, f.y);
      f.y -= 0.7;
      f.a -= 0.02;
      cx.globalAlpha = 1;
    }
    this.parts = this.parts.filter((q) => q.life > 0);
    this.rings = this.rings.filter((r) => r.a > 0);
    this.floats = this.floats.filter((f) => f.a > 0);

    if (this.shake > 0.3) {
      this.canvas.style.transform = `translate(${(Math.random() - 0.5) * this.shake}px,${(Math.random() - 0.5) * this.shake}px)`;
      this.shake *= 0.84;
    } else if (this.canvas.style.transform) {
      this.canvas.style.transform = "";
    }
  }
}
