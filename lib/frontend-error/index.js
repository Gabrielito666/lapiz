/**
 * @file
 * @source lib/frontend-error/index.js
 * @description Class's to make Frontend tipical Errors
 */

const LapizFrontendError = class
{
	/**
	 * @param {"internal-server-error"|"bad-request"|"forbidden"|"bad-response"|"fetch-error"|"parse-error"} type
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
	 */
	static byResponse(res)
	{
		const type = res.headers.get("lapiz-backend-error");
		const message = res.headers.get("lapiz-backend-error-message") || undefined;
		if(type === "internal-server-error") return new LapizFrontendError_InternalServerError(message);
		if(type === "bad-request") return new LapizFrontendError_BadRequest(message);
		if(type === "forbidden") return new LapizFrontendError_Forbidden(message);
		
		return void 0;
	}
}

const LapizFrontendError_InternalServerError = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("internal-server-error", message);
	}
}
const LapizFrontendError_BadRequest = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("bad-request", message);
	}
}
const LapizFrontendError_Forbidden = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("forbidden", message);
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
LapizFrontendError.InternalServerError = LapizFrontendError_InternalServerError;
LapizFrontendError.BadRequest = LapizFrontendError_BadRequest;
LapizFrontendError.Forbidden = LapizFrontendError_Forbidden;
LapizFrontendError.BadResponse = LapizFrontendError_BadResponse;
LapizFrontendError.FetchError = LapizFrontendError_FetchError;
LapizFrontendError.ParseError = LapizFrontendError_ParseError

/**
 * @typedef {LapizFrontendError} TLapizFrontendError
 * @typedef {LapizFrontendError_InternalServerError} TLapizFrontendError_InternalServerError
 * @typedef {LapizFrontendError_BadRequest} TLapizFrontendError_BadRequest
 * @typedef {LapizFrontendError_Forbidden} TLapizFrontendError_Forbidden
 * @typedef {LapizFrontendError_BadResponse} TLapizFrontendError_BadResponse
 * @typedef {LapizFrontendError_FetchError} TLapizFrontendError_FetchError
 * @typedef {LapizFrontendError_ParseError} TLapizFrontendError_ParseError
 */

module.exports = LapizFrontendError;
