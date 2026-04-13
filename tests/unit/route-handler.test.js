const { describe, it } = require("node:test");
const assert = require("node:assert");
const RouteHandler = require("#lib/route-handler/index.js");
const { CreatePig } = require("../fixtures/route-handlers/create-pig.js");
const { ListPigs } = require("../fixtures/route-handlers/list-pigs.js");

describe("RouteHandler", () => {
  describe("CreatePig", () => {
    it("parses valid input correctly", () => {
      const handler = new CreatePig();
      const mockReq = {
        params: { name: "oink" },
        body: { age: 3 }
      };

      const input = handler.parseInput(mockReq);
      assert.strictEqual(input.name, "oink");
      assert.strictEqual(input.age, 3);
    });

    it("returns BadRequest for invalid age", () => {
      const handler = new CreatePig();
      const mockReq = {
        params: { name: "oink" },
        body: { age: "not-a-number" }
      };

      const result = handler.parseInput(mockReq);
      assert.ok(result instanceof RouteHandler.Error.BadRequest);
      assert.strictEqual(result.message, "The 'age' field must be a number");
    });

    it("returns BadRequest when age is missing", () => {
      const handler = new CreatePig();
      const mockReq = {
        params: { name: "oink" },
        body: {}
      };

      const result = handler.parseInput(mockReq);
      assert.ok(result instanceof RouteHandler.Error.BadRequest);
    });

    it("handle returns pig data", async () => {
      const handler = new CreatePig();
      const output = await handler.handle({ name: "oink", age: 3 });

      assert.strictEqual(output.success, true);
      assert.strictEqual(output.pig.name, "oink");
      assert.strictEqual(output.pig.age, 3);
    });

    it("buildRes builds correct response", () => {
      const handler = new CreatePig();
      const res = handler.buildRes({ success: true, pig: { id: 1 } });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.contentType, "application/json");
      assert.strictEqual(res.body.success, true);
    });
  });

  describe("ListPigs", () => {
    it("parseInput returns empty object", () => {
      const handler = new ListPigs();
      const result = handler.parseInput({});
      assert.deepStrictEqual(result, {});
    });

    it("handle returns pig list", async () => {
      const handler = new ListPigs();
      const output = await handler.handle({});

      assert.ok(Array.isArray(output.pigs));
      assert.strictEqual(output.pigs.length, 2);
    });

    it("buildRes builds correct JSON response", () => {
      const handler = new ListPigs();
      const res = handler.buildRes({ pigs: [] });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.contentType, "application/json");
    });
  });

  describe("toSafe", () => {
    it("returns data on success", async () => {
      const promise = Promise.resolve({ ok: true });
      const result = await RouteHandler.toSafe(promise);
      assert.deepStrictEqual(result, { data: { ok: true }, error: null });
    });

    it("returns error on rejection", async () => {
      const promise = Promise.reject(new Error("fail"));
      const result = await RouteHandler.toSafe(promise);
      assert.strictEqual(result.data, null);
      assert.strictEqual(result.error.message, "fail");
    });
  });

  describe("makeMiddleware", () => {
    it("creates middleware that calls parseInput, handle, buildRes", async () => {
      const handler = new ListPigs();
      const middleware = RouteHandler.makeMiddelware(handler);

      let sentStatus = null;
      let sentBody = null;

      const mockReq = { params: {}, body: {} };
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: () => {},
        send: () => {},
        contentType: () => {}
      };
      mockRes.json = (body) => { sentBody = body; };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 200);
      assert.ok(Array.isArray(sentBody.pigs));
    });

    it("returns 400 on BadRequest from parseInput", async () => {
      const handler = new CreatePig();
      const middleware = RouteHandler.makeMiddelware(handler);

      const mockReq = {
        params: { name: "oink" },
        body: { age: "bad" }
      };
      const headers = {};
      let sentStatus = null;
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: (k, v) => { headers[k] = v; },
        send: () => {},
        getHeader: (k) => headers[k]
      };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 400);
      assert.strictEqual(mockRes.getHeader("lapiz-backend-error"), "bad-request");
    });

    it("handle returns BadRequest and middleware sets headers", async () => {
      const handler = new CreatePig();
      const middleware = RouteHandler.makeMiddelware(handler);

      const mockReq = {
        params: { name: "existing-pig" },
        body: { age: 3 }
      };
      const headers = {};
      let sentStatus = null;
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: (k, v) => { headers[k] = v; },
        send: () => {},
        getHeader: (k) => headers[k],
        json: () => {},
        contentType: () => {}
      };

      // Mock handle to return BadRequest
      const originalHandle = handler.handle;
      handler.handle = async () => {
        return new RouteHandler.Error.BadRequest("Pig already exists");
      };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 400);
      assert.strictEqual(headers["lapiz-backend-error"], "bad-request");
      assert.strictEqual(headers["lapiz-backend-error-message"], "Pig already exists");

      handler.handle = originalHandle;
    });

    it("handle returns Forbidden and middleware sets status 403", async () => {
      const handler = new CreatePig();
      const middleware = RouteHandler.makeMiddelware(handler);

      const mockReq = {
        params: { name: "oink" },
        body: { age: 3 }
      };
      const headers = {};
      let sentStatus = null;
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: (k, v) => { headers[k] = v; },
        send: () => {},
        getHeader: (k) => headers[k],
        json: () => {},
        contentType: () => {}
      };

      const originalHandle = handler.handle;
      handler.handle = async () => {
        return new RouteHandler.Error.Forbidden("Only admins can create pigs");
      };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 403);
      assert.strictEqual(headers["lapiz-backend-error"], "forbidden");
      assert.strictEqual(headers["lapiz-backend-error-message"], "Only admins can create pigs");

      handler.handle = originalHandle;
    });

    it("handle returns InternalServerError and middleware sets status 500", async () => {
      const handler = new CreatePig();
      const middleware = RouteHandler.makeMiddelware(handler);

      const mockReq = {
        params: { name: "oink" },
        body: { age: 3 }
      };
      const headers = {};
      let sentStatus = null;
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: (k, v) => { headers[k] = v; },
        send: () => {},
        getHeader: (k) => headers[k],
        json: () => {},
        contentType: () => {}
      };

      const originalHandle = handler.handle;
      handler.handle = async () => {
        return new RouteHandler.Error.InternalServerError("Database error");
      };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 500);
      assert.strictEqual(headers["lapiz-backend-error"], "internal-server-error");
      assert.strictEqual(headers["lapiz-backend-error-message"], "Database error");

      handler.handle = originalHandle;
    });

    it("handle throws error and middleware returns status 500", async () => {
      const handler = new CreatePig();
      const middleware = RouteHandler.makeMiddelware(handler);

      const mockReq = {
        params: { name: "oink" },
        body: { age: 3 }
      };
      const headers = {};
      let sentStatus = null;
      const mockRes = {
        status: (code) => { sentStatus = code; return mockRes; },
        setHeader: (k, v) => { headers[k] = v; },
        send: () => {},
        getHeader: (k) => headers[k],
        json: () => {},
        contentType: () => {}
      };

      const originalHandle = handler.handle;
      handler.handle = async () => {
        throw new Error("unexpected db failure");
      };

      await middleware(mockReq, mockRes);

      assert.strictEqual(sentStatus, 500);
      assert.strictEqual(headers["lapiz-backend-error"], "internal-server-error");
      assert.strictEqual(headers["lapiz-backend-error-message"], "Unexpected server error");

      handler.handle = originalHandle;
    });
  });
});
