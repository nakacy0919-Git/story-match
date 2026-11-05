const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHandler } = require("../api/mission-settings");
const defaults = {
  readingAccuracy: 80,
  puzzleSeconds: 0,
  randomPoints: 0,
  listeningPoints: 0,
};
test("settings API authenticates writes, validates numbers, and shares persisted values", async () => {
  const old = process.env.STORY_MATCH_ADMIN_PASSWORD;
  process.env.STORY_MATCH_ADMIN_PASSWORD = "test-admin-secret";
  process.env.VERCEL_ENV = "preview";
  const files = new Map();
  let writes = 0;
  const handler = createHandler({
    blob: async () => ({
      get: async (name) =>
        files.has(name)
          ? { statusCode: 200, stream: new Response(files.get(name)).body }
          : null,
      put: async (name, body) => {
        writes++;
        files.set(name, body);
      },
    }),
  });
  const call = async (method, body) => {
    const res = {
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(n) {
        this.code = n;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      },
    };
    await handler(
      { method, body, headers: { "x-forwarded-for": "test-client" } },
      res,
    );
    return res;
  };
  try {
    assert.deepEqual((await call("GET")).data.rules, defaults);
    assert.equal(
      (
        await call("POST", {
          action: "save",
          password: "wrong",
          rules: defaults,
        })
      ).code,
      401,
    );
    assert.equal(writes, 0);
    assert.equal(
      (await call("POST", { action: "verify", password: "test-admin-secret" }))
        .code,
      200,
    );
    assert.equal(
      (
        await call("POST", {
          action: "save",
          password: "test-admin-secret",
          rules: { ...defaults, readingAccuracy: 0 },
        })
      ).code,
      400,
    );
    assert.equal(writes, 0);
    const values = {
      readingAccuracy: 60,
      puzzleSeconds: 90,
      randomPoints: 500,
      listeningPoints: 600,
    };
    assert.equal(
      (
        await call("POST", {
          action: "save",
          password: "test-admin-secret",
          rules: values,
        })
      ).code,
      200,
    );
    assert.deepEqual((await call("GET")).data.rules, values);
    assert.equal(writes, 1);
    process.env.VERCEL_ENV = "production";
    assert.deepEqual((await call("GET")).data.rules, defaults);
    assert.equal((await call("DELETE")).code, 405);
  } finally {
    if (old === undefined) delete process.env.STORY_MATCH_ADMIN_PASSWORD;
    else process.env.STORY_MATCH_ADMIN_PASSWORD = old;
    delete process.env.VERCEL_ENV;
  }
});

test("password formatting is normalized and failures distinguish throttling", async () => {
  const old = process.env.STORY_MATCH_ADMIN_PASSWORD;
  process.env.STORY_MATCH_ADMIN_PASSWORD = "24680";
  const handler = createHandler();
  const call = async (password, ip = "normalization-client") => {
    const res = {
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(n) {
        this.code = n;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      },
    };
    await handler(
      {
        method: "POST",
        body: { action: "verify", password },
        headers: { "x-forwarded-for": ip },
      },
      res,
    );
    return res;
  };
  try {
    assert.equal((await call("２４６８０")).code, 200);
    assert.equal((await call(" 24680\n")).code, 200);
    assert.equal((await call("2468")).code, 401);
    for (let i = 0; i < 15; i++)
      assert.equal((await call("wrong", "throttle-client")).code, 401);
    const limited = await call("wrong", "throttle-client");
    assert.equal(limited.code, 429);
    assert.ok(Number(limited.headers["Retry-After"]) > 0);
    delete process.env.STORY_MATCH_ADMIN_PASSWORD;
    assert.equal((await call("24680")).code, 503);
  } finally {
    if (old === undefined) delete process.env.STORY_MATCH_ADMIN_PASSWORD;
    else process.env.STORY_MATCH_ADMIN_PASSWORD = old;
  }
});
