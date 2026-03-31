const { describe, it } = require("node:test");
const assert = require("node:assert");
const SDK = require("#lib/sdk/index.js");
const CreatePig = require("#test/fixtures/api-callers/create-pig.js");
const ListPigs = require("#test/fixtures/api-callers/list-pigs.js");

describe("SDK", () => {
  it("registers callers by name", () => {
    const sdk = new SDK(new CreatePig(), new ListPigs());
    assert.ok(sdk.callersMap["create-pig"]);
    assert.ok(sdk.callersMap["list-pigs"]);
  });

  it("has correct callers count", () => {
    const sdk = new SDK(new CreatePig(), new ListPigs());
    assert.strictEqual(Object.keys(sdk.callersMap).length, 2);
  });

  it("caller has correct name", () => {
    const sdk = new SDK(new CreatePig());
    assert.strictEqual(sdk.callersMap["create-pig"].name, "create-pig");
  });
});
