import { readStoredJSON, writeStoredJSON } from "./storage";
export const profileKey = (s) =>
  JSON.stringify([s.class.trim(), String(s.number).trim(), s.name.trim()]);
export const progressKey = (s) => "storyMatchProgress:v1:" + profileKey(s);
export function loadProgress(student) {
  const value = readStoredJSON(progressKey(student), {});
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const records = {};
  for (const [unit, item] of Object.entries(value)) {
    if (!item || typeof item !== "object") continue;
    const record = { reading: {}, puzzle: {} };
    for (const [scene, number] of Object.entries(item.reading || {})) {
      if (Number.isFinite(number) && number >= 0 && number <= 100)
        record.reading[scene] = number;
    }
    for (const [level, result] of Object.entries(item.puzzle || {})) {
      if (Number.isFinite(result?.best) && result.best >= 0)
        record.puzzle[level] = result;
    }
    for (const mode of ["random", "listening"]) {
      const quiz = item[mode];
      if (!quiz || typeof quiz !== "object") continue;
      record[mode] = {
        ...quiz,
        bestByCount: Object.fromEntries(
          Object.entries(quiz.bestByCount || {}).filter(
            ([, n]) => Number.isFinite(n) && n >= 0,
          ),
        ),
      };
    }
    records[unit] = record;
  }
  return records;
}
export function sceneScores(record, total) {
  return Array.from({ length: total }, (_, i) => {
    const n = record?.reading?.[i];
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
  });
}
export function completedModes(record, total) {
  return [
    sceneScores(record, total).every((n) => n >= 80),
    Object.values(record?.puzzle || {}).some((x) => Number.isFinite(x?.best)),
    !!record?.random?.fullClear,
    !!record?.listening?.fullClear,
  ];
}
export function recordResult(previous, unit, mode, result, options = {}) {
  if (!Number.isFinite(result) || result < 0) return previous;
  const record = previous[unit] || {};
  let patch;
  if (mode === "reading") {
    patch = {
      reading: {
        ...record.reading,
        [options.scene]: Math.max(record.reading?.[options.scene] || 0, result),
      },
    };
  } else if (mode === "puzzle") {
    const old = record.puzzle?.[options.level];
    patch = {
      puzzle: {
        ...record.puzzle,
        [options.level]: {
          best: Math.min(old?.best ?? Infinity, result),
          last: result,
        },
      },
    };
  } else {
    const old = record[mode] || {};
    const count = options.count;
    const bestByCount = {
      ...old.bestByCount,
      [count]: Math.max(old.bestByCount?.[count] ?? 0, result),
    };
    patch = {
      [mode]: {
        ...old,
        bestByCount,
        last: result,
        count,
        fullClear: old.fullClear || count === options.total,
      },
    };
  }
  return {
    ...previous,
    [unit]: { ...record, ...patch, updated: new Date().toISOString() },
  };
}

// Older releases used a single device-wide history. Attribute it once to the
// already registered student; never expose it to a later student on that device.
export function restoreWithLegacy(student) {
  const records = loadProgress(student);
  if (!student.name || !student.class || !student.number) return records;
  const owner = profileKey(student);
  const legacyOwner = readStoredJSON("storyMatchLegacyOwner", null);
  if (legacyOwner && legacyOwner !== owner) return records;
  if (legacyOwner === owner) return records;
  const history = readStoredJSON("storyMatchHistory", []);
  const times = readStoredJSON("storyMatchBestTimes", {});
  if (times && typeof times === "object") {
    for (const [key, time] of Object.entries(times)) {
      const match = key.match(/^(\d+)-L([123])$/);
      if (!match || !Number.isFinite(time) || time < 0) continue;
      const unit = match[1],
        level = match[2];
      records[unit] ||= {};
      records[unit].puzzle ||= {};
      records[unit].puzzle[level] ||= { best: time, last: time };
    }
  }
  if (Array.isArray(history)) {
    for (const entry of history) {
      if (
        !entry ||
        !Number.isFinite(entry.result) ||
        entry.result < 0 ||
        entry.student
      )
        continue;
      if (!["random", "listening"].includes(entry.mode)) continue;
      const record = (records[entry.unit] ||= {});
      const quiz = (record[entry.mode] ||= { bestByCount: {} });
      quiz.legacyBest = Math.max(quiz.legacyBest ?? 0, entry.result);
    }
  }
  // Write the records first: a failed write can be retried on the next visit.
  if (writeStoredJSON(progressKey(student), records))
    writeStoredJSON("storyMatchLegacyOwner", owner);
  return records;
}
