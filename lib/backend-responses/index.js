/**
 * @file
 * @source lib/backend-responses/index.js
 * @description Classes to make typical backend responses
 */

/**
 * @import {LapizResVOID} from "#lib/types/backend.d.ts"
 */

/**
 * Clase base abstracta de las respuestas backend
 * @class
 * @abstract
 */
const LapizBackendResponse = class
{
	/**
	 * @param {number} status
	 * @param {Record<string, string>} [headers]
	 * @param {unknown} [body]
	 */
	constructor(status, headers, body)
	{
		this.status = status;
		this.headers = headers;
		this.body = body;
	}
}

/**
 * Response class to make a redirect (3xx) response
 * @class
 * @extends {LapizBackendResponse}
 * @implements {LapizResVOID}
 */
const RESPONSE_REDIRECT = class extends LapizBackendResponse
{
	/** @type {undefined} */
	body = void 0;

	/**
	 * @param {string} location
	 * @param {number} [status=302]
	 */
	constructor(location, status = 302)
	{
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
 * @typedef {LapizBackendResponse} TLapizBackendResponse
 * @typedef {RESPONSE_REDIRECT} TRESPONSE_REDIRECT
 */

module.exports = LapizBackendResponse;
