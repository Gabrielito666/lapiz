const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const router = require("#test/fixtures/router.js");
const sdk = require("#test/fixtures/sdk.js");

describe("SDK with real server", () => {
  /** @type {import("http").Server} */
  let server;
  /** @type {string} */
  let baseUrl;

  before(async () => {
    const app = express();
    router.addToApp(app);

    return new Promise((resolve) => {
      server = app.listen(3001, () => {
	      baseUrl = "http://localhost:3001"
	      resolve(void 0);
      });
    });
  });

  after(() => {
    server.close();
  });

  describe("sdk.call", () => {
    it("calls create-pig and returns success", async () => {
      const caller = sdk.callersMap["create-pig"];
      caller.host = baseUrl;

      const result = await sdk.call("create-pig", { name: "oink", age: 3 });


      assert.strictEqual(result.error, null);
      assert.strictEqual(result.output.success, true);
      assert.strictEqual(result.output.data.pig.name, "oink");
    });

    it("calls list-pigs and returns pig array", async () => {
      const caller = sdk.callersMap["list-pigs"];
      caller.host = baseUrl;

      const result = await sdk.call("list-pigs", {});

      assert.strictEqual(result.error, null);
      assert.ok(Array.isArray(result.output.pigs));
    });
  });
});
