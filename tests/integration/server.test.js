const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const router = require("#test/fixtures/router.js");

describe("Server integration", () => {
  /** @type {import("http").Server} */
  let server;
  /** @type {string} */
  let baseUrl;

  before(async () => {
    const app = express();
    router.addToApp(app);

    return new Promise((resolve) => {
      server = app.listen(3000, () => {
        baseUrl = `http://localhost:3000`;
        resolve(void 0);
      });
    });
  });

  after(() => {
    server.close();
  });

  describe("POST /create-pig/:name", () => {
    it("creates pig and returns 200", async () => {
      const res = await fetch(`${baseUrl}/create-pig/oink`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ age: 3 })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.pig.name, "oink");
      assert.strictEqual(body.pig.age, 3);
    });

    it("returns 500 for invalid age", async () => {
      const res = await fetch(`${baseUrl}/create-pig/oink`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ age: "not-a-number" })
      });

      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.headers.get("lapiz-backend-error"), "bad-request");
    });
  });

  describe("GET /pigs", () => {
    it("returns pig list", async () => {
      const res = await fetch(`${baseUrl}/pigs`);

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.pigs));
      assert.strictEqual(body.pigs.length, 2);
    });
  });
});
