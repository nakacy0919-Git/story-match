// Storage can be unavailable in private mode or contain data from an older version.
export function readStoredJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

export function writeStoredJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // A full or blocked storage area must not prevent a student from playing.
    return false;
  }
}
