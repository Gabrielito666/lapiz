const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const Router = require("#lib/router/index.js");
const { UseMiddleware } = require("#test/fixtures/route-handlers/use-chain.js");
const { GetAfterUse } = require("#test/fixtures/route-handlers/use-chain.js");

describe("Middleware chain", () => {
  /** @type {import("http").Server} */
  let server;
  /** @type {string} */
  let baseUrl;

  before(async () => {
    const app = express();
    const router = new Router(new UseMiddleware(), new GetAfterUse());
    router.addToApp(app);

    return new Promise((resolve) => {
      server = app.listen(3002, () => {
        baseUrl = "http://localhost:3002";
        resolve(void 0);
      });
    });
  });

  after(() => {
    server.close();
  });

  it("USE calls next and GET handler responds", async () => {
    const res = await fetch(`${baseUrl}/guarded`);

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.middlewareApplied, true);
  });

  it("response includes header set by USE middleware", async () => {
    const res = await fetch(`${baseUrl}/guarded`);

    assert.strictEqual(res.headers.get("x-middleware"), "true");
  });

  it("USE does not send its own response", async () => {
    const res = await fetch(`${baseUrl}/guarded`);

    assert.strictEqual(res.headers.get("lapiz-backend-error"), null);
    assert.notStrictEqual(res.status, 500);
  });
});
