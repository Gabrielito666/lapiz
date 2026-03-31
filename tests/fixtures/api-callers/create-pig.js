const ApiCaller = require("#lib/api-caller/index.js");

class CreatePig extends ApiCaller.POST {
  constructor() {
    super("create-pig", "http://localhost:3000", "/create-pig/:name");
  }

  buildReq(input) {
    return {
      contentType: "application/json",
      routeParams: { name: input.name },
      body: { age: input.age }
    };
  }

  parseOutput(rawResponse, extra) {
    if (rawResponse.status === 200) {
      return { success: true, error: null, data: extra.body };
    }
    if (rawResponse.status === 500) {
      return {
        success: false,
        error: new Error("Failed to create pig"),
        data: null
      };
    }
    return new ApiCaller.Error.UnexpectedResponse("Unexpected server response");
  }
}

module.exports = CreatePig;
