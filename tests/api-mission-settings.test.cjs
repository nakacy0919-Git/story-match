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
