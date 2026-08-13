/**
 * @file
 * @source lib/frontend-error/index.js
 * @description Class's to make Frontend tipical Errors
 */

const ERRORS = require("#lib/errors-mapper/index.js");

/**
 * @typedef {TErrorType | "fetch-error" | "parse-error" | "bad-response"} TLapizFrontendErrorType
 * @typedef {{
 * 	type: TLapizFrontendErrorType;
 * 	message?: string;
 * 	jsError?: Error;
 * }} TLapizFrontendErrorInstance
 * @typedef {new (message?: string, jsError?: Error) => TLapizFrontendErrorInstance} TLapizFrontendErrorClass
 * @typedef {Record<keyof typeof ERRORS, TLapizFrontendErrorClass> & {
 * 	FetchError: typeof LapizFrontendError_FetchError;
 * 	ParseError: typeof LapizFrontendError_ParseError;
 * 	BadResponse: typeof LapizFrontendError_BadResponse;
 * }} TLapizFrontendErrorStatic
 * @import {TErrorType} from "#lib/errors-mapper/index.js"
 */

const LapizFrontendError = class
{
	/**
	 * @param {TLapizFrontendErrorType} type
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(type, message, jsError)
	{
		this.type = type;
		this.message = message;
		this.jsError = jsError;
	}
	/**
	 * @param {Response} res
	 * @returns {TLapizFrontendErrorInstance|undefined}
	 */
	static byResponse(res)
	{
		const type = res.headers.get("lapiz-backend-error");
		const message = res.headers.get("lapiz-backend-error-message") || undefined;
		if(!type) return void 0;
		const found = Object.entries(ERRORS).find(([, cfg]) => cfg.type === type);
		if(!found) return void 0;
		/** @type {any} */
		const target = LapizFrontendError;
		return new target[found[0]](message);
	}
}

// Los errores HTTP se generan desde el catálogo; FetchError, ParseError y BadResponse
// se mantienen a mano porque no son HTTP sino de red y de ámbito del pipeline.
/** @type {any} */
const target = LapizFrontendError;

for (const [className, { type }] of Object.entries(ERRORS))
{
	target[className] = class extends LapizFrontendError
	{
		/**
		 * @param {string} [message]
		 */
		constructor(message)
		{
			super(type, message);
		}
	}
}

const LapizFrontendError_FetchError = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super("fetch-error", message, jsError);
	}
}
const LapizFrontendError_ParseError = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super("parse-error", message, jsError);
	}
}
const LapizFrontendError_BadResponse = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("bad-response", message);
	}
}

// Las clases no HTTP se exponen como estáticas igual que las generadas del catálogo
target.FetchError = LapizFrontendError_FetchError;
target.ParseError = LapizFrontendError_ParseError;
target.BadResponse = LapizFrontendError_BadResponse;

/**
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_InternalServerError
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_BadRequest
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_Forbidden
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_BadResponse
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_FetchError
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_ParseError
 * @typedef {TLapizFrontendErrorInstance} TLapizFrontendError_NotFound
 */

module.exports = /** @type {typeof LapizFrontendError & TLapizFrontendErrorStatic} */ (LapizFrontendError);
