const RouteHandler = require("#lib/route-handler/index.js");

class ListPigs extends RouteHandler.GET {
  constructor() {
    super("list-pigs", "/pigs");
  }

  parseInput(_rawExpressReq) {
    return {};
  }

  async handle(_input) {
    return {
      pigs: [
        { id: 1, name: "oink", age: 3 },
        { id: 2, name: "peppa", age: 5 }
      ]
    };
  }

  buildRes(output) {
    return {
      status: 200,
      contentType: "application/json",
      body: output
    };
  }
}

module.exports = { ListPigs };
