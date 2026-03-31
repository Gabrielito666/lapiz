const RouteHandler = require("#lib/route-handler/index.js");

class CreatePig extends RouteHandler.POST {
  constructor() {
    super("create-pig", "/create-pig/:name");
  }

  parseInput(rawExpressReq) {
    if (typeof rawExpressReq.body?.age !== "number") {
      return new CreatePig.Error.BadRequest("The 'age' field must be a number");
    }
    return {
      name: rawExpressReq.params.name,
      age: rawExpressReq.body.age
    };
  }

  async handle(input) {
    return {
      success: true,
      pig: { name: input.name, age: input.age, id: 1 }
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

module.exports = { CreatePig };
