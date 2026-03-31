
/**
 * @file
 * @source lib/frontend-error/index.js
 * @description Class's to make Frontend tipical Errors
 */

const LapizFrontendError = class
{
	/**
	 * @param {"unexpected-server-error"|"unexpected-server-response"|"fetch-error"|"parse-error"} type
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(type, message, jsError)
	{
		this.type = type;
		this.message = message;
		this.jsError = jsError;
	}
}

const LapizFrontendError_ServerError = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("unexpected-server-error", message);
	}
}

const LapizFrontendError_UnexpectedResponse = class extends LapizFrontendError
{
	/**
	 * @param {string} [message]
	 */
	constructor(message)
	{
		super("unexpected-server-response", message);
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
LapizFrontendError.ServerError = LapizFrontendError_ServerError;
LapizFrontendError.UnexpectedResponse = LapizFrontendError_UnexpectedResponse;
LapizFrontendError.FetchError = LapizFrontendError_FetchError;
LapizFrontendError.ParseError = LapizFrontendError_ParseError

/**
 * @typedef {LapizFrontendError} TLapizFrontendError
 * @typedef {LapizFrontendError_ServerError} TLapizFrontendError_ServerError
 * @typedef {LapizFrontendError_UnexpectedResponse} TLapizFrontendError_UnexpectedResponse
 * @typedef {LapizFrontendError_FetchError} TLapizFrontendError_FetchError
 * @typedef {LapizFrontendError_ParseError} TLapizFrontendError_ParseError
 */

export default LapizFrontendError;
