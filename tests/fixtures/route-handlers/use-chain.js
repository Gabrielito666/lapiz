const RouteHandler = require("#lib/route-handler/index.js");

class UseMiddleware extends RouteHandler.USE {
  constructor() {
    super("use-middleware", "/guarded");
  }

  parseInput(_rawExpressReq) {
    return {};
  }

  async handle(_input, extra) {
    extra.expressRes.setHeader("x-middleware", "true");
    return RouteHandler.NEXT;
  }

  buildRes(_output) {
    throw new Error("buildRes should not be called");
  }
}

class GetAfterUse extends RouteHandler.GET {
  constructor() {
    super("get-after-use", "/guarded");
  }

  parseInput(_rawExpressReq) {
    return {};
  }

  async handle(_input) {
    return { middlewareApplied: true };
  }

  buildRes(output) {
    return {
      status: 200,
      contentType: "application/json",
      body: output
    };
  }
}

module.exports = { UseMiddleware, GetAfterUse };
