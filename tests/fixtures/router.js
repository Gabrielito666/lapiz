const Router = require("#lib/router/index.js");
const { CreatePig } = require("#test/fixtures/route-handlers/create-pig.js");
const { ListPigs } = require("#test/fixtures/route-handlers/list-pigs.js");

const router = new Router(new CreatePig(), new ListPigs());

module.exports = router;
