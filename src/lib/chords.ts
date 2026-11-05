// Chord-sheet helpers: read the plain text an admin pastes in, and show its chords as written, simplified, or moved to another key.
//
// Format of `body`:
//   a section title on its own line (after a blank line), then pairs of lines:
//   a chord line (bars and chords, e.g. "| G  D | Em  C |") and, under it, the lyric line it belongs to.

const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const CHORD_RE = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M|\d+|[#b+\-°Δ()])*)(?:\/([A-G][#b]?))?$/;
const MARK_RE = /^(\||\|\||\[x\d+\]|\(x\d+\)|x\d+|\/|-|\.)$/i;

const pcOf = (n: string): number => {
  const base = "CDEFGAB".indexOf(n[0]);
  const steps = [0, 2, 4, 5, 7, 9, 11][base];
  return (steps + (n[1] === "#" ? 1 : n[1] === "b" ? -1 : 0) + 12) % 12;
};

export interface Row {
  chords: string | null;
  lyric: string | null;
  /** The lyric line with its original leading spaces, so chords can be placed over the right words. */
  lyricRaw: string | null;
}
export interface Section {
  title: string;
  rows: Row[];
}

/** True for a line made only of bars, repeat marks and chords. */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  let chords = 0;
  for (const tk of tokens) {
    if (MARK_RE.test(tk)) continue;
    // chords may be glued to bars: "|Bb"
    const bare = tk.replace(/^\|+|\|+$/g, "");
    if (bare === "") continue;
    if (!CHORD_RE.test(bare)) return false;
    chords++;
  }
  return chords > 0 || tokens.every((tk) => MARK_RE.test(tk));
}

export function parseChart(body: string): Section[] {
  const sections: Section[] = [];
  const lines = body.replace(/\r/g, "").split("\n");
  let cur: Section | null = null;
  let prevBlank = true;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") {
      prevBlank = true;
      continue;
    }
    const chordy = isChordLine(raw);
    const next = lines.slice(i + 1).find((l) => l.trim() !== "");
    // a title: first line after a blank, not itself chords, short, and followed by a chord line
    if (prevBlank && !chordy && raw.trim().length <= 40 && next !== undefined && isChordLine(next)) {
      cur = { title: raw.trim(), rows: [] };
      sections.push(cur);
      prevBlank = false;
      continue;
    }
    if (!cur) {
      cur = { title: "", rows: [] };
      sections.push(cur);
    }
    if (chordy) {
      cur.rows.push({ chords: raw.replace(/\s+$/, ""), lyric: null, lyricRaw: null });
    } else {
      const last = cur.rows[cur.rows.length - 1];
      if (last && last.chords !== null && last.lyric === null && !prevBlank) {
        last.lyric = raw.trim();
        last.lyricRaw = raw.replace(/\s+$/, "");
      } else cur.rows.push({ chords: null, lyric: raw.trim(), lyricRaw: raw.replace(/\s+$/, "") });
    }
    prevBlank = false;
  }
  return sections;
}

export type ChordType = "true" | "easy" | "lyrics";
export type Notation = "written" | "simple";

const rootName = (pc: number, flats: boolean) => (flats ? NOTES_FLAT : NOTES_SHARP)[((pc % 12) + 12) % 12];

/** Easy version of a chord: C13b9 -> C7, Cm7 -> Cm, Cmaj7 -> C, Csus4 -> C, slash bass dropped. */
export function simplifyQuality(q: string): string {
  if (/^m(?!aj)/.test(q) || /^min/.test(q) || /^dim/.test(q)) return "m";
  if (/^(maj|M|Δ|add|sus|aug|\+|6|5)/.test(q) || q === "") return "";
  if (/^(7|9|11|13)/.test(q)) return "7";
  return "";
}

interface Options {
  type: ChordType;
  notation: Notation;
  /** semitones to move up (negative moves down) */
  shift: number;
  flats: boolean;
}

function mapChord(tok: string, o: Options): string {
  const lead = tok.match(/^\|+/)?.[0] ?? "";
  const trail = tok.match(/\|+$/)?.[0] ?? "";
  const bare = tok.slice(lead.length, tok.length - trail.length);
  const m = CHORD_RE.exec(bare);
  if (!m) return tok;
  let quality = m[2];
  let bass: string | null = m[3] ?? null;
  if (o.type === "easy") {
    quality = simplifyQuality(quality);
    bass = null;
  }
  // Notes are respelled when the chart is moved, or when "simple" notation is chosen (Cb -> B, E# -> F, ...).
  // Otherwise the name is kept exactly as written.
  const respell = o.shift !== 0 || o.notation === "simple";
  const spell = (name: string) => (respell ? rootName(pcOf(name) + o.shift, o.flats) : name);
  return `${lead}${spell(m[1])}${quality}${bass !== null ? `/${spell(bass)}` : ""}${trail}`;
}

/**
 * Rewrites a chord line. Spacing is kept so chords stay above their words: when a chord gets longer, it takes
 * the spaces that followed it; when shorter, the spaces are added back.
 */
export function formatChordLine(line: string, o: Options): string {
  const parts = line.split(/(\s+)/);
  let debt = 0; // extra characters used so far that later spaces must give back
  return parts
    .map((p) => {
      if (p === "") return p;
      if (/^\s+$/.test(p)) {
        const give = Math.min(debt, Math.max(0, p.length - 1));
        debt -= give;
        return p.slice(0, p.length - give) + (debt < 0 ? " ".repeat(-debt) : "");
      }
      if (MARK_RE.test(p) || /^\|+$/.test(p)) return p;
      const out = mapChord(p, o);
      debt += out.length - p.length;
      if (debt < 0) {
        const pad = " ".repeat(-debt);
        debt = 0;
        return out + pad;
      }
      return out;
    })
    .join("");
}

/** Does the chart use flat chord names? Used to pick flats or sharps when moving it. */
export function prefersFlats(body: string): boolean {
  return /(^|\s|\|)[A-G]b/.test(body.split("\n").filter(isChordLine).join(" "));
}

/** Root note of a chord as a pitch class (0 = C ... 11 = B), or null when the text is not a chord. */
export function chordRootPc(token: string): number | null {
  const bare = token.replace(/^\|+|\|+$/g, "");
  const m = CHORD_RE.exec(bare);
  return m ? pcOf(m[1]) : null;
}

/** Root, third and fifth of a chord as pitch classes: the notes a strum has to contain. Extensions are ignored on purpose, to forgive a missed string. */
export function chordTones(token: string): number[] | null {
  const bare = token.replace(/^\|+|\|+$/g, "");
  const m = CHORD_RE.exec(bare);
  if (!m) return null;
  const root = pcOf(m[1]);
  const q = m[2];
  let third = 4;
  let fifth = 7;
  if (/^sus2/.test(q)) third = 2;
  else if (/^sus/.test(q)) third = 5;
  else if (/^dim/.test(q)) {
    third = 3;
    fifth = 6;
  } else if (/^aug|^\+/.test(q)) fifth = 8;
  else if (/^m(?!aj)|^min/.test(q)) third = 3;
  return [root, (root + third) % 12, (root + fifth) % 12];
}

/** Index where each word of `text` starts (Intl.Segmenter also finds words in languages written without spaces, like Thai). */
function wordStarts(text: string): number[] {
  const starts: number[] = [];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "word" });
    for (const part of seg.segment(text)) if (part.isWordLike) starts.push(part.index);
    return starts;
  }
  for (const m of text.matchAll(/\S+/g)) starts.push(m.index ?? 0);
  return starts;
}

/**
 * Splits a chord line and the lyric under it into pieces: each chord with the words that follow it up to the next chord.
 * Chords are matched to words by their column in the pasted text, then moved back to the start of the word they fall in,
 * so a word is never cut in two.
 */
export function rowSegments(chords: string, lyricRaw: string | null, map: (chord: string) => string): Segment[] {
  const found: { pos: number; chord: string; bar: boolean }[] = [];
  let bar = false;
  for (const m of chords.matchAll(/\S+/g)) {
    const tok = m[0];
    const lead = /^\|/.test(tok);
    const bare = tok.replace(/^\|+|\|+$/g, "");
    if (lead) bar = true;
    if (bare !== "" && !MARK_RE.test(bare) && CHORD_RE.test(bare)) {
      found.push({ pos: (m.index ?? 0) + (tok.length - tok.replace(/^\|+/, "").length), chord: bare, bar });
      bar = /\|+$/.test(tok);
    } else if (/^\|+$/.test(tok)) {
      bar = true;
    }
  }
  const text = lyricRaw ?? "";
  if (found.length === 0) return text.trim() ? [{ chord: null, text: text.trim(), bar: false }] : [];
  const starts = wordStarts(text);
  for (const f of found) {
    if (f.pos >= text.length) continue;
    let best = 0;
    for (const st of starts) {
      if (st <= f.pos) best = st;
      else break;
    }
    f.pos = best;
  }
  const out: Segment[] = [];
  const first = text.slice(0, found[0].pos).trim();
  if (first) out.push({ chord: null, text: first, bar: false });
  found.forEach((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].pos : text.length;
    out.push({ chord: map(f.chord), text: text.slice(Math.min(f.pos, text.length), Math.max(end, f.pos)).replace(/^\s+/, ""), bar: f.bar });
  });
  return out;
}

export interface Segment {
  /** Chord over this piece of the lyric, or null for the words before the first chord. */
  chord: string | null;
  text: string;
  /** A bar line comes right before this chord. */
  bar: boolean;
}

/** True when the text is a single chord name such as Bb, F#m7, C/E. */
export function isChordToken(tok: string): boolean {
  return CHORD_RE.test(tok.replace(/^\|+|\|+$/g, ""));
}

/** Root pitch class and quality text of a chord name, e.g. "F#m7" -> { rootPc: 6, quality: "m7" }. */
export function parseChord(token: string): { rootPc: number; quality: string } | null {
  const m = CHORD_RE.exec(token.replace(/^\|+|\|+$/g, ""));
  return m ? { rootPc: pcOf(m[1]), quality: m[2] } : null;
}
