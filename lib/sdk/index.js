/**
 * @file
 * @source ./lib/sdk/index.js
 * @module lapiz/sdk
 * @description Class to build a SDK from a list of ApiCaller's
 */

/**
 * @import {IApiCaller} from "#lib/api-caller/index.js"
 * @import { TLapizFrontendError } from "#lib/frontend-error/index.js"
 */

import ApiCaller from "#lib/api-caller/index.js";

/**
 * @template {IApiCaller<string, string, any, any, any, any>[]}Callers
 * @template N
 * @typedef {Extract<Callers[number], { name: N }>} CallerByName
 */

/**
 * @template {IApiCaller<string, string, any, any, any, any>[]}Callers
 * @class
 */
const SDK = class
{
	/**
	 * @param {Callers} callers
	 */
	constructor(...callers)
	{
		/**
		 * @typedef {{ [Name in Callers[number]["name"]]: CallerByName<Callers, Name> }} CallersMap
		 */
		/**@type {CallersMap}*/
		this.callersMap = callers
			.reduce((acc, c) => ({ ...acc, [c.name]: c }), /**@type {CallersMap}*/({}));
	}
	/**
	 * @template {Callers[number]["name"]}N
	 * @param {N} name
	 * @param {Parameters<CallerByName<Callers, N>["buildReq"]>[0]} input
	 * @returns {Promise<{error: TLapizFrontendError; output: null}|{error: null; output: ReturnType<CallerByName<Callers, N>["parseRes"]>}>}
	 */
	call(name, input)
	{
		const caller = this.callersMap[name];

		/**@type {ReturnType<CallerByName<Callers, N>["parseRes"]>}*/

		return ApiCaller.call(caller, input);
	}
}

export default SDK;
