const { describe, it } = require("node:test");
const assert = require("node:assert");
const LapizBackendError = require("#lib/backend-error/index.js");

describe("LapizBackendError", () => {
  describe("BadRequest", () => {
    it("creates error with code 400", () => {
      const error = new LapizBackendError.BadRequest("invalid input");
      assert.strictEqual(error.code, 400);
    });

    it("creates error with type bad-request", () => {
      const error = new LapizBackendError.BadRequest("invalid input");
      assert.strictEqual(error.type, "bad-request");
    });

    it("creates error with message", () => {
      const error = new LapizBackendError.BadRequest("the input is wrong");
      assert.strictEqual(error.message, "the input is wrong");
    });

    it("creates error without message", () => {
      const error = new LapizBackendError.BadRequest();
      assert.strictEqual(error.message, undefined);
    });

    it("propagates jsError", () => {
      const jsError = new Error("original error");
      const error = new LapizBackendError.BadRequest("input invalid", jsError);
      assert.strictEqual(error.jsError, jsError);
    });
  });

  describe("Forbidden", () => {
    it("creates error with code 403", () => {
      const error = new LapizBackendError.Forbidden("not authorized");
      assert.strictEqual(error.code, 403);
    });

    it("creates error with type forbidden", () => {
      const error = new LapizBackendError.Forbidden("not authorized");
      assert.strictEqual(error.type, "forbidden");
    });

    it("creates error with message", () => {
      const error = new LapizBackendError.Forbidden("admin only");
      assert.strictEqual(error.message, "admin only");
    });

    it("creates error without message", () => {
      const error = new LapizBackendError.Forbidden();
      assert.strictEqual(error.message, undefined);
    });

    it("propagates jsError", () => {
      const jsError = new Error("original error");
      const error = new LapizBackendError.Forbidden("access denied", jsError);
      assert.strictEqual(error.jsError, jsError);
    });
  });

  describe("InternalServerError", () => {
    it("creates error with code 500", () => {
      const error = new LapizBackendError.InternalServerError("db failed");
      assert.strictEqual(error.code, 500);
    });

    it("creates error with type internal-server-error", () => {
      const error = new LapizBackendError.InternalServerError("db failed");
      assert.strictEqual(error.type, "internal-server-error");
    });

    it("creates error with message", () => {
      const error = new LapizBackendError.InternalServerError("database connection lost");
      assert.strictEqual(error.message, "database connection lost");
    });

    it("creates error without message", () => {
      const error = new LapizBackendError.InternalServerError();
      assert.strictEqual(error.message, undefined);
    });

    it("propagates jsError", () => {
      const jsError = new Error("original error");
      const error = new LapizBackendError.InternalServerError("db error", jsError);
      assert.strictEqual(error.jsError, jsError);
    });
  });

  describe("static shortcuts", () => {
    it("BadRequest is accessible as static property", () => {
      assert.strictEqual(LapizBackendError.BadRequest, LapizBackendError.BadRequest);
    });

    it("Forbidden is accessible as static property", () => {
      assert.strictEqual(LapizBackendError.Forbidden, LapizBackendError.Forbidden);
    });

    it("InternalServerError is accessible as static property", () => {
      assert.strictEqual(LapizBackendError.InternalServerError, LapizBackendError.InternalServerError);
    });
  });

  describe("catalog declaration", () => {
    const ERRORS = require("#lib/errors-mapper/index.js");

    it("declares every catalog error as a static class", () => {
      const classNames = Object.keys(ERRORS);

      assert.ok(classNames.length >= 40, `expected at least 40 errors, got ${classNames.length}`);

      for (const className of classNames) {
        const { code, type } = ERRORS[className];
        const errorClass = LapizBackendError[className];

        assert.strictEqual(typeof errorClass, "function", `${className} must be declared`);
        const error = new errorClass("test message");
        assert.ok(error instanceof LapizBackendError, `${className} instance must extend LapizBackendError`);
        assert.strictEqual(error.code, code, `${className} must have code ${code}`);
        assert.strictEqual(error.type, type, `${className} must have type ${type}`);
        assert.strictEqual(error.message, "test message", `${className} must keep the message`);
      }
    });

    it("declares legacy shortcut statics", () => {
      assert.strictEqual(typeof LapizBackendError.BadRequest, "function");
      assert.strictEqual(typeof LapizBackendError.Forbidden, "function");
      assert.strictEqual(typeof LapizBackendError.NotFound, "function");
      assert.strictEqual(typeof LapizBackendError.InternalServerError, "function");
    });
  });
});