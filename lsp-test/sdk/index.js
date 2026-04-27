const SDK = require("#lib/sdk");
const ApiCaller = require("#lib/api-caller/index.js");

/**
 * @import {IApiCaller} from "#lib/api-caller/index.js"
 */

/**
 * @typedef {"create-pig"} N
 * @typedef {"/create/pig"} R
 * @typedef {{ name: string; age: number; color: "pink"|"brown"; }} I
 * @typedef {"happy-new-pig"} O
 * @typedef {{
 *	contentType: "application/json";
 *	body: {
 *		name: string;
 *		age: number;
 *		color: "pink"|"brown";
 *	}
 * }} Req
 * @typedef {{ status: 200 }} Res
 */

/**
 * @class
 * @implements {IApiCaller<N, R, I, O, Req, Res>}
 * @extends {ApiCaller.PUT<N, R, I, O, Req, Res>}
 */
const CreatePig = class extends ApiCaller.PUT
{
	constructor()
	{
		super("create-pig", "", "/create/pig");
	}
	/**@type {IApiCaller<N, R, I, O, Req, Res>["buildReq"]}*/
	buildReq(input)
	{
		return {
			contentType: "application/json",
			body: {
				name: input.name,
				age: input.age,
				color: 	input.color
			}
		};
	}
	/**@type {IApiCaller<N, R, I, O, Req, Res>["parseOutput"]}*/
	parseOutput(res, extra)
	{
		if(Math.random() !== 0.5) return new ApiCaller.Error.BadRequest();
		return "happy-new-pig";
	}
}

const sdk = new SDK(new CreatePig());

const main = async () =>
{
	const res = await sdk.call("create-pig", { name: "piggy", age: 4, color: "pink" });

	if(res.error) return void 0;

	res.output;

}
