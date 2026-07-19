const RouteHandler = require("#lib/route-handler/index.js");

class NextParseInput extends RouteHandler.GET {
  constructor() {
    super("next-parse-input", "/next-parse");
  }

  parseInput(_rawExpressReq) {
    return RouteHandler.NEXT;
  }

  async handle(_input) {
    throw new Error("handle should not be called");
  }

  buildRes(_output) {
    throw new Error("buildRes should not be called");
  }
}

class NextHandle extends RouteHandler.GET {
  constructor() {
    super("next-handle", "/next-handle");
  }

  parseInput(_rawExpressReq) {
    return {};
  }

  async handle(_input) {
    return RouteHandler.NEXT;
  }

  buildRes(_output) {
    throw new Error("buildRes should not be called");
  }
}

class NextBuildRes extends RouteHandler.GET {
  constructor() {
    super("next-build-res", "/next-build-res");
  }

  parseInput(_rawExpressReq) {
    return {};
  }

  async handle(_input) {
    return { ok: true };
  }

  buildRes(_output) {
    return RouteHandler.NEXT;
  }
}

module.exports = { NextParseInput, NextHandle, NextBuildRes };
