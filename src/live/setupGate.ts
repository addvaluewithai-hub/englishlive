/** Settle a Live connect promise exactly once, with an optional setup deadline. */
export function createSetupGate(resolve: () => void, reject: (error: Error) => void) {
  let settled = false;
  let timer: number | null = null;
  const clearTimer = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  };
  return {
    get settled() { return settled; },
    arm(ms: number, onTimeout: () => void) { clearTimer(); timer = window.setTimeout(onTimeout, ms); },
    clearTimer,
    resolve() { if (settled) return; settled = true; clearTimer(); resolve(); },
    reject(error: Error) { if (settled) return; settled = true; clearTimer(); reject(error); },
  };
}
