/**
 * @file
 * @source lib/backend-error/index.js
 * @description Class's to make tipical backend errors
 */

const LapizBackendError = class
{
	/**
	 * @param {"bad-request"|"server-error"} type
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

const LapizBackendError_BadRequest = class extends LapizBackendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super("bad-request", message, jsError);
	}
}

const LapizBackendError_ServerError = class extends LapizBackendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super("server-error", message, jsError);
	}
}

LapizBackendError.BadRequest = LapizBackendError_BadRequest;
LapizBackendError.ServerError = LapizBackendError_ServerError;

/**
 * @typedef {LapizBackendError} TLapizBackendError
 * @typedef {LapizBackendError_BadRequest} TLapizBackendError_BadRequest
 * @typedef {LapizBackendError_ServerError} TLapizBackendError_ServerError
 */

module.exports = LapizBackendError;
