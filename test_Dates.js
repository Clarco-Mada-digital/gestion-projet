const weekStart = new Date("2026-02-22T00:00:00Z");
const s = new Date("2026-02-25T00:00:00Z");
const e = new Date("2026-02-25T00:00:00Z"); // same start and end
const startIdx = Math.max(0, Math.floor((s.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
const endIdx = Math.min(6, Math.floor((e.getTime() - 1 - weekStart.getTime()) / (24 * 3600 * 1000)));
console.log({ startIdx, endIdx, span: endIdx - startIdx + 1 });
