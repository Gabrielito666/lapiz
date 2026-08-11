/**
 * @file
 * @source ./tests/fixtures/route-handlers/redirect.js
 * @description Fixture de route-handler que responde un redirect manual (status 302 + header location)
 */

const RouteHandler = require("#lib/route-handler/index.js");

/**
 * Route-handler de prueba que responde un redirect manual con status 302 y header location
 * @class
 * @extends {RouteHandler.GET}
 */
const RedirectToTarget = class extends RouteHandler.GET
{
	/**
	 * @constructor
	 */
	constructor()
	{
		super("redirect-to-target", "/redirect");
	}
	/**
	 * @param {import("express").Request} _rawExpressReq
	 * @returns {{}}
	 */
	parseInput(_rawExpressReq)
	{
		return {};
	}
	/**
	 * @param {{}} _input
	 * @returns {Promise<{}>}
	 */
	async handle(_input)
	{
		return {};
	}
	/**
	 * @param {{}} _output
	 * @returns {{
	 * 	status: 302;
	 * 	headers: {location: string};
	 * }}
	 */
	buildRes(_output)
	{
		return {
			status: 302,
			headers: { location: "/target" }
		};
	}
}

module.exports = { RedirectToTarget };
