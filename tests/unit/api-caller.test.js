const { describe, it } = require("node:test");
const assert = require("node:assert");
const ApiCaller = require("#lib/api-caller/index.js");
const CreatePig = require("#test/fixtures/api-callers/create-pig.js");
const ListPigs = require("#test/fixtures/api-callers/list-pigs.js");

describe("ApiCaller", () => {
  describe("assembleUrl", () => {
    it("assembles URL with route params", () => {
      const url = ApiCaller.assembleUrl(
        "http://localhost:3000",
        "/create-pig/:name",
        { name: "oink" }
      );
      assert.strictEqual(url, "http://localhost:3000/create-pig/oink");
    });

    it("assembles URL with multiple route params", () => {
      const url = ApiCaller.assembleUrl(
        "http://localhost:3000",
        "/pigs/:owner/:name",
        { owner: "john", name: "peppa" }
      );
      assert.strictEqual(url, "http://localhost:3000/pigs/john/peppa");
    });

    it("returns host + route when no params", () => {
      const url = ApiCaller.assembleUrl(
        "http://localhost:3000",
        "/pigs",
        {}
      );
      assert.strictEqual(url, "http://localhost:3000/pigs");
    });
  });

  describe("toSafe", () => {
    it("returns data on success", async () => {
      const promise = Promise.resolve({ ok: true });
      const result = await ApiCaller.toSafe(promise);
      assert.deepStrictEqual(result, { data: { ok: true }, error: null });
    });

    it("returns error on rejection", async () => {
      const promise = Promise.reject(new Error("fail"));
      const result = await ApiCaller.toSafe(promise);
      assert.strictEqual(result.data, null);
      assert.strictEqual(result.error.message, "fail");
    });
  });

  describe("static call (mocked)", () => {
    it("calls buildReq and parseOutput correctly", async () => {
      const caller = new CreatePig();

      const req = caller.buildReq({ name: "oink", age: 3 });
      assert.strictEqual(req.routeParams.name, "oink");
      assert.strictEqual(req.body.age, 3);
      assert.strictEqual(req.contentType, "application/json");
    });

    it("GET caller does not have contentType or body", () => {
      const caller = new ListPigs();
      const req = caller.buildReq({});
      assert.strictEqual(req.contentType, undefined);
      assert.strictEqual(req.body, undefined);
    });
  });
});
