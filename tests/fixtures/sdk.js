const SDK = require("#lib/sdk/index.js");
const CreatePig = require("#test/fixtures/api-callers/create-pig.js");
const ListPigs = require("#test/fixtures/api-callers/list-pigs.js");

const sdk = new SDK(new CreatePig(), new ListPigs());

module.exports = sdk;
