import { useState, useEffect, useCallback } from "react";
import { DEFAULT_RULES, safeRules, validateRules } from "./missionRules";
import { readStoredJSON, writeStoredJSON } from "./storage";
export function useMissionRules() {
  const [rules, setRules] = useState(() =>
    safeRules(readStoredJSON("storyMatchMissionRulesCache", DEFAULT_RULES)),
  );
  const accept = useCallback((value) => {
    const next = validateRules(value);
    setRules(next);
    writeStoredJSON("storyMatchMissionRulesCache", next);
  }, []);
  useEffect(() => {
    if (typeof fetch !== "function") return;
    const controller = new AbortController();
    const refresh = () =>
      fetch("/api/mission-settings", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw Error("load");
          return r.json();
        })
        .then((data) => accept(data.rules))
        .catch(() => {});
    refresh();
    const id = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [accept]);
  return { rules, accept };
}
