const { describe, it } = require("node:test");
const assert = require("node:assert");
const LapizFrontendError = require("#lib/frontend-error/index.js");

describe("LapizFrontendError", () => {
  describe("BadRequest", () => {
    it("creates error with type bad-request", () => {
      const error = new LapizFrontendError.BadRequest("invalid input");
      assert.strictEqual(error.type, "bad-request");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.BadRequest("the input is wrong");
      assert.strictEqual(error.message, "the input is wrong");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.BadRequest();
      assert.strictEqual(error.message, undefined);
    });
  });

  describe("Forbidden", () => {
    it("creates error with type forbidden", () => {
      const error = new LapizFrontendError.Forbidden("not authorized");
      assert.strictEqual(error.type, "forbidden");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.Forbidden("admin only");
      assert.strictEqual(error.message, "admin only");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.Forbidden();
      assert.strictEqual(error.message, undefined);
    });
  });

  describe("InternalServerError", () => {
    it("creates error with type internal-server-error", () => {
      const error = new LapizFrontendError.InternalServerError("server failed");
      assert.strictEqual(error.type, "internal-server-error");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.InternalServerError("database error");
      assert.strictEqual(error.message, "database error");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.InternalServerError();
      assert.strictEqual(error.message, undefined);
    });
  });

  describe("BadResponse", () => {
    it("creates error with type bad-response", () => {
      const error = new LapizFrontendError.BadResponse("unexpected format");
      assert.strictEqual(error.type, "bad-response");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.BadResponse("unexpected body");
      assert.strictEqual(error.message, "unexpected body");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.BadResponse();
      assert.strictEqual(error.message, undefined);
    });
  });

  describe("FetchError", () => {
    it("creates error with type fetch-error", () => {
      const error = new LapizFrontendError.FetchError("network failed");
      assert.strictEqual(error.type, "fetch-error");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.FetchError("no connection");
      assert.strictEqual(error.message, "no connection");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.FetchError();
      assert.strictEqual(error.message, undefined);
    });

    it("propagates jsError", () => {
      const jsError = new Error("original error");
      const error = new LapizFrontendError.FetchError("fetch failed", jsError);
      assert.strictEqual(error.jsError, jsError);
    });
  });

  describe("ParseError", () => {
    it("creates error with type parse-error", () => {
      const error = new LapizFrontendError.ParseError("parse failed");
      assert.strictEqual(error.type, "parse-error");
    });

    it("creates error with message", () => {
      const error = new LapizFrontendError.ParseError("invalid json");
      assert.strictEqual(error.message, "invalid json");
    });

    it("creates error without message", () => {
      const error = new LapizFrontendError.ParseError();
      assert.strictEqual(error.message, undefined);
    });

    it("propagates jsError", () => {
      const jsError = new Error("original error");
      const error = new LapizFrontendError.ParseError("parse error", jsError);
      assert.strictEqual(error.jsError, jsError);
    });
  });

  describe("byResponse", () => {
    it("returns BadRequest for bad-request header", () => {
      const mockRes = {
        headers: {
          get: (k) => {
            if (k === "lapiz-backend-error") return "bad-request";
            if (k === "lapiz-backend-error-message") return "invalid input";
            return undefined;
          }
        }
      };
      const error = LapizFrontendError.byResponse(mockRes);
      assert.ok(error instanceof LapizFrontendError.BadRequest);
      assert.strictEqual(error.message, "invalid input");
    });

    it("returns Forbidden for forbidden header", () => {
      const mockRes = {
        headers: {
          get: (k) => {
            if (k === "lapiz-backend-error") return "forbidden";
            if (k === "lapiz-backend-error-message") return "not authorized";
            return undefined;
          }
        }
      };
      const error = LapizFrontendError.byResponse(mockRes);
      assert.ok(error instanceof LapizFrontendError.Forbidden);
      assert.strictEqual(error.message, "not authorized");
    });

    it("returns InternalServerError for internal-server-error header", () => {
      const mockRes = {
        headers: {
          get: (k) => {
            if (k === "lapiz-backend-error") return "internal-server-error";
            if (k === "lapiz-backend-error-message") return "db error";
            return undefined;
          }
        }
      };
      const error = LapizFrontendError.byResponse(mockRes);
      assert.ok(error instanceof LapizFrontendError.InternalServerError);
      assert.strictEqual(error.message, "db error");
    });

    it("returns undefined when no header", () => {
      const mockRes = {
        headers: {
          get: (k) => undefined
        }
      };
      const error = LapizFrontendError.byResponse(mockRes);
      assert.strictEqual(error, undefined);
    });

    it("returns undefined for unrecognized header value", () => {
      const mockRes = {
        headers: {
          get: (k) => {
            if (k === "lapiz-backend-error") return "unknown-error";
            return undefined;
          }
        }
      };
      const error = LapizFrontendError.byResponse(mockRes);
      assert.strictEqual(error, undefined);
    });
  });

  describe("static shortcuts", () => {
    it("BadRequest is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.BadRequest, LapizFrontendError.BadRequest);
    });

    it("Forbidden is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.Forbidden, LapizFrontendError.Forbidden);
    });

    it("InternalServerError is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.InternalServerError, LapizFrontendError.InternalServerError);
    });

    it("BadResponse is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.BadResponse, LapizFrontendError.BadResponse);
    });

    it("FetchError is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.FetchError, LapizFrontendError.FetchError);
    });

    it("ParseError is accessible as static property", () => {
      assert.strictEqual(LapizFrontendError.ParseError, LapizFrontendError.ParseError);
    });
  });
});