/**
 * @file
 * @source lib/sdk/index.js
 * @module lapiz/sdk
 * @description This module is for create a SDK to front by a record of Endpoints
 * @requires module:lib/lapiz
 */

import Lapiz from "#lib/lapiz";
import LapizError from "#lib/lapiz-error";
import { z } from "zod";
import FetchHandlerByContentType from "#lib/fetch-handler";
import LapizConstants from "#lib/constants";

/**
 * @import Endpoint from "#lib/endpoint"
 * @import {Declaration} from "#lib/declaration"
 * @import {ContentType, ReqOf, ResOf} from "#lib/lapiz"
 */

/**
 * FRONT CALLER REQ
 * @template {Endpoint<any, any, Declaration<any>>}E
 * @typedef {{
 *	urlParams: ReqOf<E>["urlParams"];
 *	contentType: ReqOf<E>["contentType"];
 *	headersParams: ReqOf<E>["headersParams"];
 *	body: ReqOf<E>["contentType"] extends "application/void" ? undefined :
 *		ReqOf<E>["contentType"] extends "image/jpeg" ? File :
 *		ReqOf<E>["body"];
 * }} FrontCallerReq
 */

/**
 * FRONT CALLER RES
 * @template {Endpoint<any, any, Declaration<any>>}E
 * @typedef {{
 *	contentType: ReqOf<E>["contentType"];
 *	status: ResOf<E>["status"];
 *	headersParams: ResOf<E>["headersParams"];
 *	body: ResOf<E>["contentType"] extends "application/void" ? undefined :
 *		ResOf<E>["contentType"] extends "image/jpeg" ? ReadableStream :
 *		ResOf<E>["body"];
 *	fetchRes: Response;
 * }} FrontCallerRes
 */

/**
 * @template {string}Name
 * @template {string}Url
 * @template {Endpoint<Name, Url, Declaration<Url>>}E
 * @param {E} endpoint
 * @param {FrontCallerReq<E>} request
 * @returns {Promise<{result: FrontCallerRes<E>; error: null}|{result:null; error:LapizError}>}
 * @throws {Error} If the server send a invalid response just. Is not a error to catch... is to fix server response
 */
const caller = async(endpoint, request) =>
{
	const fetchRes = await FetchHandlerByContentType.instance
		.fetchReq(request.contentType, /**@type {any}*/(endpoint), request);

	if(fetchRes instanceof Lapiz.Error) return { error: fetchRes, result: null };
	if(fetchRes.error)
	{
		return { error: new Lapiz.Error.Fetch(fetchRes.error), result: null };
	}

	const resContentType = Lapiz.isLapizContentType(fetchRes.result.headers.get("Content-Type"));

	if(!resContentType)
	{
		throw new Error("[LAPIZ ERROR]: Invalid response.headers['content-type']. See the documentation to see the valid Lapiz ContentTypes");
	}

	const resParsed = await FetchHandlerByContentType.instance
		.parseRes(resContentType, /**@type {any}*/(endpoint), fetchRes.result);
	
	if(resParsed instanceof Error)
	{
		//rejectar errores de tipado del response... el server siempre debe responder con un tipo correcto
		throw resParsed;
	}
	if(resParsed instanceof Lapiz.Error)
	{
		//Retornamos errores esperables
		return { error: resParsed, result: null };
	}

	//TODO: ver el error de tipos con calma
	return {
		result: /**@type {FrontCallerRes<E>}*/(/**@type {unknown}*/(resParsed)),
		error: null
	}
};

/**
 * @template {Endpoint<any, any, Declaration<any>>[]}EPs
 * @class
 * @classdesc This class is for make a SDK by an array of Endpoints
 * @extends {LapizConstants}
 */
const SDK = class extends LapizConstants
{
	/**
	 * @param {EPs} endpoints
	 */
	constructor(...endpoints)
	{
		super();

		/**
		 * @constant
		 * @private
		 * @type {Map<string, Endpoint<any, any, Declaration<any>>>}
		 */
		this.endpointsMap = new Map();
		endpoints.forEach(e => { this.endpointsMap.set(e.name, e) });
	}
	/**
	 * @template {EPs[number]["name"]} N
	 * @param {N} name
	 * @param {FrontCallerReq<Extract<EPs[number], {name: N}>>} request
	 * @returns {Promise<{ result: FrontCallerRes<Extract<EPs[number], {name: N}>>; error: null }|{ result: null; error: LapizError}>}
	 */
	call(name, request)
	{
		const ep = this.endpointsMap.get(name);
		if(!ep)
		{
			throw new Error("[LAPIZ ERROR]: the name of your endpoint is bad");
		}
		return caller(ep, request);
	}
}

export default SDK;
