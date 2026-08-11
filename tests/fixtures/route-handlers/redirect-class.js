/**
 * @file
 * @source ./tests/fixtures/route-handlers/redirect-class.js
 * @description Fixture de route-handler que responde un redirect manual usando la class RouteHandler.Response.Redirect
 */

const RouteHandler = require("#lib/route-handler/index.js");

/**
 * @import {TRESPONSE_REDIRECT} from "#lib/backend-responses/index.js"
 */

/**
 * Route-handler de prueba que responde un redirect manual usando la class Response.Redirect
 * @class
 * @extends {RouteHandler.GET}
 */
const RedirectClass = class extends RouteHandler.GET
{
	/**
	 * @constructor
	 */
	constructor()
	{
		super("redirect-class", "/redirect-class");
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
	 * @returns {TRESPONSE_REDIRECT}
	 */
	buildRes(_output)
	{
		return new RouteHandler.Response.Redirect("/target");
	}
}

module.exports = { RedirectClass };
