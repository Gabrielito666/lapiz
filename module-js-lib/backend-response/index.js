
/**
 * @file
 * @source lib/backend-responses/index.js
 * @description Classes to make typical backend responses
 */

/**
 * @import {LapizResVOID} from "#module-js-lib/types/backend.d.ts"
 */

/**
 * Clase base abstracta de las respuestas backend
 * @class
 * @abstract
 * @template {number} S
 * @template {Record<string, string>|undefined} H
 * @template {unknown|undefined} B
 */
const LapizBackendResponse = class
{
	/**@type {S}*/
	status;
	/**@type {H}*/
	headers;
	/**@type {B}*/
	body;
	/**
	 * @param {S} status
	 * @param {H} headers
	 * @param {B} body
	 */
	constructor(status, headers, body)
	{
		this.status = status;
		this.headers = headers;
		this.body = body;
	}
}

/**
 * @template {string} [L=string]
 * @template {number} [S=302]
 * @typedef {{
 * 	body: void;
 * 	status: S;
 * 	headers: { location: L; };
 * }} Response_Redirect
 */

/**
 * Response class to make a redirect (3xx) response
 * @class
 * @template {string} [L=string]
 * @template {number} [S=302]
 * @extends {LapizBackendResponse<S, { location: L }, void>}
 * @implements {LapizResVOID}
 * @implements {Response_Redirect<L, S>}
 */
const RESPONSE_REDIRECT = class extends LapizBackendResponse
{
	/** @type {undefined} */
	body = void 0;

	/**
	 * @param {L} location
	 * @param {S} [_status]
	 */
	constructor(location, _status)
	{
		const status = _status ?? /**@type {S}*/ (302);
		if(!Number.isInteger(status) || status < 300 || status > 399)
		{
			throw new Error(
				`[Lapiz Error]: RESPONSE_REDIRECT status must be a 3xx status code, received: ${status}`
			);
		}
		super(status, { location }, void 0);
	}
}

LapizBackendResponse.Redirect = RESPONSE_REDIRECT;

/**
 * @template {number} S
 * @template {Record<string, string>} H
 * @template {unknown} B
 * @typedef {LapizBackendResponse<S, H, B>} TLapizBackendResponse
 */
/**
 * @typedef {RESPONSE_REDIRECT} TRESPONSE_REDIRECT
 */

export default LapizBackendResponse;
