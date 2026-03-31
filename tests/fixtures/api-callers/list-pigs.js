
const ApiCaller = require("#lib/api-caller/index.js");
class ListPigs extends ApiCaller.GET {
  constructor() {
    super("list-pigs", "http://localhost:3000", "/pigs");
  }

  buildReq(_input) {
    return {
      routeParams: {}
    };
  }

  parseOutput(rawResponse, extra) {
    if (rawResponse.status === 200) {
      return { success: true, error: null, pigs: extra.body.pigs };
    }
    return new ApiCaller.Error.UnexpectedResponse("Unexpected server response");
  }
}

module.exports = ListPigs;
