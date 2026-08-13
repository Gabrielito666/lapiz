/**
 * @file
 * @source lib/backend-error/index.js
 * @description Class's to make tipical backend errors
 */

const ERRORS = require("#lib/errors-mapper/index.js");

/**
 * @typedef {{
 * 	code: TErrorCode;
 * 	type: TErrorType;
 * 	message?: string;
 * 	jsError?: Error;
 * }} TLapizBackendErrorInstance
 * @typedef {new (message?: string, jsError?: Error) => TLapizBackendErrorInstance} TLapizBackendErrorClass
 * @typedef {Record<keyof typeof ERRORS, TLapizBackendErrorClass>} TLapizBackendErrorStatic
 * @import {TErrorCode, TErrorType} from "#lib/errors-mapper/index.js"
 */

const LapizBackendError = class
{
	/**
	 * @param {TErrorCode} code
	 * @param {TErrorType} type
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

// Las clases se generan desde el catálogo y se adhieren como estáticas de la clase base.
// La asignación dinámica es invisible para checkJs (por eso el cast a any);
// el contrato de tipos se restaura en el cast de module.exports.
/** @type {any} */
const target = LapizBackendError;

for (const [className, { code, type }] of Object.entries(ERRORS))
{
	target[className] = class extends LapizBackendError
	{
		/**
		 * @param {string} [message]
		 * @param {Error} [jsError]
		 */
		constructor(message, jsError)
		{
			super(code, type, message, jsError);
		}
	}
}

/**
 * @typedef {TLapizBackendErrorInstance} TLapizBackendError
 * @typedef {TLapizBackendErrorInstance} TLapizBackendError_BadRequest
 * @typedef {TLapizBackendErrorInstance} TLapizBackendError_InternalServerError
 * @typedef {TLapizBackendErrorInstance} TLapizBackendError_Forbidden
 * @typedef {TLapizBackendErrorInstance} TLapizBackendError_NotFound
 */
module.exports = /** @type {typeof LapizBackendError & TLapizBackendErrorStatic} */ (LapizBackendError);
