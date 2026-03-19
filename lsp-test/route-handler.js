const RouteHandler = require("#lib/route-handler/index.js");

/**
 * @typedef {"create-pig"} N
 * @typedef {"/create/pig"} R
 * @typedef {{ pigName: string; pigAge: number }} I
 * @typedef {"oink"|"muu"} O
 * @typedef {{
 *	contentType: "application/json"
 *	body: { pigName: string; pigAge: number; }
 * }} Req
 * @typedef {{
 *	status: 200;
 * }|{
 *	status: 500;
 * }} Res
 */

/**@import {IRouteHandler} from "#lib/route-handler/index.js"*/

/**
 * @extends {RouteHandler.PUT<N, R, I, O, Req, Res>}
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 */
const CreatePig = class extends RouteHandler.PUT
{
	constructor()
	{
		super("create-pig", "/create/pig");
	}
}
