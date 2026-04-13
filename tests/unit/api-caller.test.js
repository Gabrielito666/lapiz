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

  describe("fetch error pipeline", () => {
    it("returns FetchError on network fail", async () => {
      const caller = new CreatePig();

      // Mock fetch to throw
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        throw new Error("network error");
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      assert.ok(result instanceof ApiCaller.Error.FetchError);
      assert.strictEqual(result.type, "fetch-error");
    });

    it("returns BadRequest when server responds with error header", async () => {
      const caller = new CreatePig();

      // Mock fetch to return response with error header
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 400,
          headers: {
            "lapiz-backend-error": "bad-request",
            "lapiz-backend-error-message": "invalid input"
          }
        });
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      assert.ok(result instanceof ApiCaller.Error.BadRequest);
      assert.strictEqual(result.message, "invalid input");
    });

    it("returns Forbidden when server responds with 403", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 403,
          headers: {
            "lapiz-backend-error": "forbidden",
            "lapiz-backend-error-message": "not authorized"
          }
        });
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      assert.ok(result instanceof ApiCaller.Error.Forbidden);
      assert.strictEqual(result.message, "not authorized");
    });

    it("returns InternalServerError when server responds with 500", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 500,
          headers: {
            "lapiz-backend-error": "internal-server-error",
            "lapiz-backend-error-message": "db error"
          }
        });
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      assert.ok(result instanceof ApiCaller.Error.InternalServerError);
      assert.strictEqual(result.message, "db error");
    });

    it("returns ParseError when JSON parsing fails", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response("not valid json", {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      assert.ok(result instanceof ApiCaller.Error.ParseError);
      assert.strictEqual(result.type, "parse-error");
    });

    it("passes to parseOutput on successful response", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const result = await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));

      globalThis.fetch = originalFetch;

      // Result should be { rawRes, extra } - NOT an error
      assert.strictEqual(result.error, undefined);
      assert.ok(result.rawRes instanceof Response);
      assert.strictEqual(result.extra.contentType, "application/json");
    });

    it("throws when server responds with unknown lapiz-backend-error", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 418,
          headers: {
            "lapiz-backend-error": "some-unknown-error"
          }
        });
      };

      try {
        await ApiCaller.fetch(caller, caller.buildReq({ name: "oink", age: 3 }));
        assert.fail("Should have thrown");
      }
      catch(err) {
        assert.ok(err.message.includes("not yet supported"));
      }
      finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("call integration", () => {
    it("returns output on successful call", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const result = await ApiCaller.call(caller, { name: "oink", age: 3 });

      globalThis.fetch = originalFetch;

      // The fixture's parseOutput returns { success, error, data }
      assert.strictEqual(result.error, null);
      assert.strictEqual(result.output.success, true);
      assert.strictEqual(result.output.error, null);
    });

    it("returns BadResponse when parseOutput returns it", async () => {
      // Custom caller that returns BadResponse
      const BadResponseCaller = class extends ApiCaller.POST {
        constructor() {
          super("bad-response-test", "http://localhost:3000", "/test");
        }
        buildReq() {
          return { "content-type": "application/json", routeParams: {}, body: {} };
        }
        parseOutput() {
          return new ApiCaller.Error.BadResponse("unexpected body");
        }
      };

      const caller = new BadResponseCaller();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ wrong: "format" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const result = await ApiCaller.call(caller, {});

      globalThis.fetch = originalFetch;

      assert.ok(result.error instanceof ApiCaller.Error.BadResponse);
      assert.strictEqual(result.output, null);
    });

    it("returns error when fetch returns error", async () => {
      const caller = new CreatePig();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 403,
          headers: {
            "lapiz-backend-error": "forbidden",
            "lapiz-backend-error-message": "not allowed"
          }
        });
      };

      const result = await ApiCaller.call(caller, { name: "oink", age: 3 });

      globalThis.fetch = originalFetch;

      assert.ok(result.error instanceof ApiCaller.Error.Forbidden);
      assert.strictEqual(result.output, null);
    });
  });
});
