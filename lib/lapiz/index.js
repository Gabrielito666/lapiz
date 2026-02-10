/**
 * @file
 * @source lib/lapiz/index.js
 * @module lapiz
 * @description This module is principal Lapiz module and  use to declare Endpoints
 */

const LapizError = require("#lib/lapiz-error");
const {z} = require("zod");
const Endpoint = require("#lib/endpoint");

/**
 * @import {Declaration, VoidReqDeclaration} from "#lib/declaration"
 */

/**
 * CONTENT TYPE
 * @typedef {"application/void"|"text/plain"|"application/json"|"image/jpeg"} ContentType
 */

const Lapiz = class
{
	static declareEndpoint = {
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {VoidReqDeclaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		get(name, url, declaration)
		{
			return  new Endpoint(name, "GET", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {Declaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		put(name, url, declaration)
		{
			return  new Endpoint(name, "PUT", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {Declaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		post(name, url, declaration)
		{
			return  new Endpoint(name, "POST", url, declaration);
		},
		/**
		 * @template {string} Name
		 * @template {string} Url
		 * @template {VoidReqDeclaration<Url>} D
		 * @param {Name} name
		 * @param {Url} url
		 * @param {D} declaration
		 * @returns {Endpoint<Name, Url, D>}
		 */
		delete(name, url, declaration)
		{
			return  new Endpoint(name, "DELETE", url, declaration);
		}
	}

	/**@type {ContentType[]}*/
	static contentTypes = ["application/void", "text/plain", "application/json", "image/jpeg"];
	static contentTypeSchemas = {
		void: z.literal("application/void"),
		textPlain: z.literal("text/plain"),
		applicationJson: z.literal("application/json"),
		jpegImage: z.literal("image/jpeg")
	}
	static statusList = {
		notFound_404: z.literal(404)
		//etc
	}

	static Error = LapizError;

	/**
	 * @param {any} contentType
	 * @return {ContentType|false}
	 */
	static isLapizContentType(contentType)
	{
		if(!contentType) return "application/void";

		const contentTypeStr = String(contentType).trim();

		const mimeType = contentTypeStr
			.split(';')[0]
			.split(' ')[0]
			.trim()
			.toLowerCase();

		if(Lapiz.contentTypes.includes(/**@type {any}*/(mimeType)))
		{
			return /**@type {ContentType}*/(mimeType);
		}

		return false;
	}
	/**
	 * This function modify the prototype from LapizError to set a custom message
	 * @param {{
	 *	invalidRequest: string;
	 *	fetch: string;
	 *	clientParseBody: string;
	 *	unexpected: string;
	 * }} customMessages
	 */
	static setCustomErrorMessages(customMessages)
	{
		Lapiz.Error.prototype.message = customMessages.unexpected;
		Lapiz.Error.InvalidRequest.prototype.message = customMessages.invalidRequest;
		Lapiz.Error.Fetch.prototype.message = customMessages.fetch;
		LapizError.ClientParseBody.prototype.message = customMessages.clientParseBody;
	}

	constructor()
	{
		//empty for now
	}
};

//UTILITYS
/**
 * @template {{ declaration: { request: z.ZodTypeAny; }}}E
 * @typedef {z.infer<E["declaration"]["request"]>} ReqOf
 */

/**
 * @template {{declaration: {response: z.ZodTypeAny; }}}E
 * @typedef {z.infer<E["declaration"]["response"]>} ResOf
 */

module.exports = Lapiz;
