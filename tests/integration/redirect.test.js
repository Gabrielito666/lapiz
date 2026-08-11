/**
 * @file
 * @source ./tests/integration/redirect.test.js
 * @description Test de integración que verifica que un route-handler puede responder un redirect manual (302 + Location) con un fetch sin seguir el redirect
 */

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const Router = require("#lib/router/index.js");
const { RedirectToTarget } = require("#test/fixtures/route-handlers/redirect.js");
const { RedirectClass } = require("#test/fixtures/route-handlers/redirect-class.js");

describe("Redirect integration", () =>
{
	/** @type {import("http").Server} */
	let server;
	/** @type {string} */
	let baseUrl;

	before(async () =>
	{
		const app = express();
		const router = new Router(new RedirectToTarget(), new RedirectClass());
		router.addToApp(app);

		return new Promise((resolve) =>
		{
			server = app.listen(3003, () =>
			{
				baseUrl = `http://localhost:3003`;
				resolve(void 0);
			});
		});
	});

	after(() =>
	{
		server.close();
	});

	it("responde 302 con el header location cuando el handler devuelve un redirect manual", async () =>
	{
		const res = await fetch(`${baseUrl}/redirect`, { redirect: "manual" });

		assert.strictEqual(res.status, 302);
		assert.strictEqual(res.headers.get("location"), "/target");
		assert.strictEqual(res.headers.get("lapiz-void-response"), "true");
	});

	it("responde 302 con el header location usando la class RouteHandler.Response.Redirect", async () =>
	{
		const res = await fetch(`${baseUrl}/redirect-class`, { redirect: "manual" });

		assert.strictEqual(res.status, 302);
		assert.strictEqual(res.headers.get("location"), "/target");
		assert.strictEqual(res.headers.get("lapiz-void-response"), "true");
	});
});
