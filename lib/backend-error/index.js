/**
 * @file
 * @source lib/backend-error/index.js
 * @description Class's to make tipical backend errors
 */

const LapizBackendError = class
{
	/**
	 * @param {"bad-request"} type
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

LapizBackendError.BadRequest = LapizBackendError_BadRequest;

/**
 * @typedef {LapizBackendError} TLapizBackendError
 * @typedef {LapizBackendError_BadRequest} TLapizBackendError_BadRequest
 */

module.exports = LapizBackendError;
