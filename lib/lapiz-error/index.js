/**
 * @file
 * @source lib/lapiz-error
 * @description Is a module with the expected errors for lapiz
 */

const {z} = require("zod");

/**
 * @typedef {"generic"|"invalid-request"|"fetch"|"client-parse-body"} ErrorTypes
 * @typedef {"__LAPIZ_ERROR__:THIS_IS_A:__LAPIZ_ERROR__"} LAPIZ_ERROR_WATERMARCK
 */

/**@type{LAPIZ_ERROR_WATERMARCK}*/
const waterMarck = "__LAPIZ_ERROR__:THIS_IS_A:__LAPIZ_ERROR__";

const lapizErrorSchema = z.object({
	type: z.union([
		z.literal("generic"),
		z.literal("invalid-request"),
		z.literal("fetch"),
		z.literal("client-parse-body")
	]),
	description: z.string(),
	specifications: z.string().optional(),
	message: z.string(),
	lapiz_error_watermarck: z.literal(waterMarck)
});

/**
 * @class 
 * @description Represents a tipical Lapiz Error
 */
const LapizError = class
{
	/**
	 * @param {LapizError} err
	 * @returns {string}
	 */
	static errorToJson(err)
	{
		//destruimos el error de js si existe para evitar transmitir datos del server
		err.jsError = undefined;
		return JSON.stringify(err);
	}
	/**
	 * @param {any} candidat
	 * @returns {null|LapizError}
	 */
	static jsonToError(candidat)
	{
		if(typeof candidat === "string")
		{
			try {
				candidat = JSON.parse(candidat);
			}
			catch(err)
			{
				return null;
			}
		}

		const validation = lapizErrorSchema.safeParse(candidat);
		if(validation.error) return null;

		if(validation.data.type === "invalid-request") return new LapizError.InvalidRequest(validation.data.specifications);
		if(validation.data.type === "fetch") return new LapizError.Fetch(validation.data.specifications);
		if(validation.data.type === "client-parse-body") return new LapizError.ClientParseBody(validation.data.specifications);
		
		return new LapizError(validation.data.description, validation.data.specifications);
	}
	/**
	 * @param {string} description
	 * @param {string} [specifications]
	 * @param {Error} [jsError]
	 */
	constructor(description, specifications, jsError)
	{
		/**@constant @readonly @type {string}*/
		this.description = description;
		/**@type {string|undefined}*/
		this.specifications = specifications;
		/**@type {Error|undefined}*/
		this.jsError = jsError;
	}
	/**@type {ErrorTypes}*/
	type = "generic";
	/**@type {string}*/
	message = "Unexpected error";
	/**@type {LAPIZ_ERROR_WATERMARCK}*/
	lapiz_error_watermarck = waterMarck;
}

/**
 * @class
 * @classdesc This error represents a invalid-request error
 * @extends {LapizError}
 */
LapizError.InvalidRequest = class extends LapizError
{
	/**
	 * @param {string} [specifications]
	 * @param {Error} [jsError]
	 */
	constructor(specifications, jsError)
	{
		super(
			"[Lapiz ERROR]: invalid request. API expect other type, Lapiz not send this request",
			specifications,
			jsError
		);
	}
	/**@type {ErrorTypes}*/
	type = "invalid-request";
	/**@type {string}*/
	message = "User send a invalid Request";
}
/**
 * @class
 * @classdesc This error represents a fetch-red error
 * @extends {LapizError}
 */
LapizError.Fetch = class extends LapizError
{
	/**
	 * @param {string} [specifications]
	 * @param {Error} [jsError]
	 */
	constructor(specifications, jsError)
	{
		super("[Lapiz ERROR]: Fetch falied in client", specifications, jsError);
	}
	/**@type {ErrorTypes}*/
	type = "fetch";
	/**@type {string}*/
	message = "Red error";
}

/**
 * @class
 * @classdesc This error represents a error in ther front body parser ej : res.json() error
 * @extends {LapizError}
 */
LapizError.ClientParseBody = class extends LapizError
{
	/**
	 * @param {string} [specifications]
	 * @param {Error} [jsError]
	 */
	constructor(specifications, jsError)
	{
		super(
			"[Lapiz ERROR]: In client, the body of response can't be parsed",
			specifications,
			jsError
		);
	}
	/**@type {ErrorTypes}*/
	type = "client-parse-body"
	/**@type {string}*/
	message = "Error in the Request format";
}

/**
 * @typedef {LapizError} TLapizError
 */

module.exports = LapizError;
