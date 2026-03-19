import ApiCaller from "#lib/api-caller";

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

/**@import {IApiCaller} from "#lib/api-caller"*/

/**
 * @extends {ApiCaller.PUT<N, R, I, O, Req, Res>}
 * @implements {IApiCaller<N, R, I, O, Req, Res>}
 */
const CreatePig = class extends ApiCaller.PUT
{
	constructor()
	{
		super("create-pig", "", "/create/pig");
	}
}
