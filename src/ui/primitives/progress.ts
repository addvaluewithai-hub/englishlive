export function normalizedProgress(value: number, max: number) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  return { value: safeValue, max: safeMax };
}
