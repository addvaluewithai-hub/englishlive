/**
 * Two turn-taking timers: a reply watchdog that only counts silence while Otti owes a reply,
 * and a short quiet gap used when the provider never sends turnComplete.
 */
export class TurnTimers {
  lastServerActivity = 0;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private quietTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly replyMs: number, private readonly quietMs: number) {}

  activity() {
    this.lastServerActivity = Date.now();
    this.clearQuiet();
  }

  awaitReply(stillOwed: () => boolean, onTimeout: () => void) {
    this.lastServerActivity = Date.now();
    this.arm(stillOwed, onTimeout);
  }

  quiet(onQuiet: () => void) {
    this.clearQuiet();
    this.quietTimer = setTimeout(() => { this.quietTimer = null; onQuiet(); }, this.quietMs);
  }

  clear() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
    this.clearQuiet();
  }

  private arm(stillOwed: () => boolean, onTimeout: () => void) {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      this.watchdog = null;
      if (!stillOwed()) return;
      if (Date.now() - this.lastServerActivity < this.replyMs) { this.arm(stillOwed, onTimeout); return; }
      onTimeout();
    }, this.replyMs);
  }

  private clearQuiet() {
    if (this.quietTimer) clearTimeout(this.quietTimer);
    this.quietTimer = null;
  }
}
