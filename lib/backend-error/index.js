/**
 * @file
 * @source lib/backend-error/index.js
 * @description Class's to make tipical backend errors
 */

const LapizBackendError = class
{
	/**
	 * @param {number} code
	 * @param {"bad-request"|"internal-server-error"|"forbidden"} type
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(code, type, message, jsError)
	{
		this.code = code;
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
		super(400, "bad-request", message, jsError);
	}
}

const LapizBackendError_InternalServerError = class extends LapizBackendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super(500, "internal-server-error", message, jsError);
	}
}

const LapizBackendError_Forbidden = class extends LapizBackendError
{
	/**
	 * @param {string} [message]
	 * @param {Error} [jsError]
	 */
	constructor(message, jsError)
	{
		super(403, "forbidden", message, jsError);
	}
}

LapizBackendError.BadRequest = LapizBackendError_BadRequest;
LapizBackendError.InternalServerError = LapizBackendError_InternalServerError;
LapizBackendError.Forbidden = LapizBackendError_Forbidden;

/**
 * @typedef {LapizBackendError} TLapizBackendError
 * @typedef {LapizBackendError_BadRequest} TLapizBackendError_BadRequest
 * @typedef {LapizBackendError_InternalServerError} TLapizBackendError_InternalServerError
 * @typedef {LapizBackendError_Forbidden} TLapizBackendError_Forbidden
 */

module.exports = LapizBackendError;
