const { createHash, timingSafeEqual } = require("node:crypto");
const { DEFAULT_RULES, validateRules } = require("../src/utils/missionRules");
const filename = () =>
  process.env.VERCEL_ENV === "production"
    ? "mission-rules-production.json"
    : "mission-rules-preview.json";
const attempts = new Map();
function authorized(req, password) {
  const configured = process.env.STORY_MATCH_ADMIN_PASSWORD;
  if (!configured)
    return {
      status: 503,
      error: "管理者認証を準備できません。時間をおいて再試行してください。",
    };
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0];
  const old = attempts.get(ip) || { n: 0, until: Date.now() + 60000 };
  if (Date.now() > old.until) {
    old.n = 0;
    old.until = Date.now() + 60000;
  }
  if (old.n >= 15)
    return {
      status: 429,
      retryAfter: Math.max(1, Math.ceil((old.until - Date.now()) / 1000)),
      error:
        "ログイン試行が多すぎます。1分ほど待ってからもう一度お試しください。",
    };
  const ok =
    typeof password === "string" &&
    timingSafeEqual(
      createHash("sha256").update(password.normalize("NFKC").trim()).digest(),
      createHash("sha256").update(configured.normalize("NFKC").trim()).digest(),
    );
  if (ok) attempts.delete(ip);
  else {
    old.n++;
    if (attempts.size > 1000) attempts.clear();
    attempts.set(ip, old);
  }
  return ok
    ? { status: 200 }
    : {
        status: 401,
        error: "パスワードが違います。数字5桁を確認してください。",
      };
}
function createHandler({ blob = () => import("@vercel/blob") } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "許可されていない操作です。" });
    }
    try {
      if (req.method === "GET") {
        const { get } = await blob();
        const file = await get(filename(), {
          access: "private",
          useCache: false,
        });
        if (!file)
          return res.status(200).json({ rules: DEFAULT_RULES, updated: null });
        if (file.statusCode !== 200) throw Error("read");
        const data = await new Response(file.stream).json();
        return res
          .status(200)
          .json({ rules: validateRules(data.rules), updated: data.updated });
      }
      let body = req.body;
      if (typeof body === "string") {
        if (body.length > 4096)
          return res.status(413).json({ error: "データが大きすぎます。" });
        try {
          body = JSON.parse(body);
        } catch (_) {
          return res.status(400).json({ error: "入力形式が不正です。" });
        }
      }
      const auth = authorized(req, body?.password);
      if (auth.status !== 200) {
        if (auth.retryAfter)
          res.setHeader("Retry-After", String(auth.retryAfter));
        return res.status(auth.status).json({ error: auth.error });
      }
      if (body.action === "verify") return res.status(200).json({ ok: true });
      if (body.action !== "save")
        return res.status(400).json({ error: "操作が不正です。" });
      let rules;
      try {
        rules = validateRules(body.rules);
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
      const updated = new Date().toISOString();
      const { put } = await blob();
      await put(filename(), JSON.stringify({ rules, updated }), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      });
      return res.status(200).json({ rules, updated });
    } catch (_) {
      return res.status(503).json({
        error: "設定を読み書きできません。時間をおいて再試行してください。",
      });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
