// Metronome click. Uses its own AudioContext and schedules each click a little ahead of time,
// so the beat stays steady even when the page is busy drawing.
// The click pitch (1760 / 2200 Hz) is above the guitar range the pitch detector listens to (up to 1100 Hz),
// so a click picked up by the microphone is never mistaken for a played note.

export class Metronome {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private next = 0;
  private beat = 0;
  private period = 0.75;

  /** Starts clicking; the first click happens `firstDelay` seconds from now. Every 4th click is accented. */
  start(bpm: number, firstDelay = 0) {
    this.stop();
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx ??= new Ctor();
    void this.ctx.resume();
    this.period = 60 / bpm;
    this.beat = 0;
    this.next = this.ctx.currentTime + firstDelay;
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  setBpm(bpm: number) {
    this.period = 60 / bpm;
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  async dispose() {
    this.stop();
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx && ctx.state !== "closed") await ctx.close();
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.next < ctx.currentTime + 0.12) {
      this.click(this.next, this.beat % 4 === 0);
      this.next += this.period;
      this.beat++;
    }
  }

  private click(at: number, accent: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = accent ? 2200 : 1760;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.22, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.07);
  }
}
