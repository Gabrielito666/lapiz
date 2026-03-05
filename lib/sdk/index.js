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
 * @template Type
 * @template T
 * @template R
 * @typedef {(
 * [Type] extends [T]
 *   ? R
 *   : Type extends object
 *     ? Type extends (...args: any[]) => any
 *      ? Type
 *      : { [K in keyof Type]: ReplaceTypeDeep<Type[K], T, R> }
 *    : Type
 * )} ReplaceTypeDeep
 */
/**
 * @template Type
 * @typedef {(
 *   Type extends object
 *     ? Type extends (...args: any[]) => any
 *       ? Type
 *       : (
 *           {
 *             [K in keyof Type as
 *               [Type[K]] extends [Record<string, never>]
 *                 ? never
 *                 : K
 *             ]: MakeNeverRecordOptional<Type[K]>
 *           } &
 *           {
 *             [K in keyof Type as
 *               [Type[K]] extends [Record<string, never>]
 *                 ? K
 *                 : never
 *             ]?: MakeNeverRecordOptional<Type[K]>
 *           }
 *         )
 *     : Type
 * )} MakeNeverRecordOptional
 */

/**
 * FRONT CALLER REQ
 * @template {Endpoint<any, any, Declaration<any>>}E
 * @typedef {MakeNeverRecordOptional<ReqOf<E>>} FrontCallerReq
 */

/**
 * FRONT CALLER RES
 * @template {Endpoint<any, any, Declaration<any>>}E
 * @typedef {ResOf<E> & { fetchRes: Response; }} FrontCallerRes
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
		return { error: new Lapiz.Error.Fetch(undefined, fetchRes.error), result: null };
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
		//Aunque si hay un error o middelware raro puede complicar... capaz que warm o similar...
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
 * @template {Endpoint<string, string, Declaration<string>>[]} EPs
 * @template {EPs[number]["name"]}N
 * @typedef {Extract<EPs[number], {name: N}>} EndpointByName
 */

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
		 * @type {{ [K in EPs[number]["name"]] : EndpointByName<EPs, K> }}
		 */
		//@ts-ignore
		this.endpointsMap = endpoints.reduce((acc, e) => ({ ...acc, [e.name]: e }), {});
	}
	/**
	 * @template {EPs[number]["name"]} N
	 * @param {N} name
	 * @param {FrontCallerReq<EndpointByName<EPs, N>>} request
	 * @returns {Promise<{result: FrontCallerRes<EndpointByName<EPs, N>>; error: null}|{result:null; error:LapizError}>}
	 */
	call(name, request)
	{
		/**@type {EndpointByName<EPs, typeof name>}*/
		const ep = this.endpointsMap[name];
		if(!ep)
		{
			throw new Error("[LAPIZ ERROR]: the name of your endpoint is bad");
		}

		return caller(ep, request);
	}
}

/**
 * @file
 * @source lib/endpoints/create-user.js
 * @description Endpoint schema for create-user
 */


const createUserEndpoint = Lapiz.declareEndpoint.put("create-user", "/create-user", {
	request: z.object({
		urlParams: z.object({}),
		headersParams: z.object({}),
		contentType: Lapiz.contentTypeSchemas.applicationJson,
		body: z.object({
			username: z.string(),
			name: z.string().optional(),
			lastname: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().optional()
		})
	}),
	response: z.union([
		z.object({
			status: Lapiz.resStatusSchemas._200_ok,
			headersParams: z.object({
				doglock_access_token: z.string(),
				doglock_refresh_token: z.string(),
				doglock_expires_access_token_at: z.string().regex(/^\d+$/, { message: "doglock_expires_access_token_at must be string with just numeric chars" })
			}),
			contentType: Lapiz.contentTypeSchemas.void,
			body: z.undefined()
		}),
		z.object({
			status: Lapiz.resStatusSchemas._409_conflict,
			contentType: Lapiz.contentTypeSchemas.applicationJson,
			headersParams: z.object({}),
			body: z.object({
				message: z.string(),
				column: z.union([z.literal("username"), z.literal("email")])
			})
		}),
	])
});

const sdk = new SDK(createUserEndpoint);

sdk.call("create-user", {contentType: "application/json", headersParams: {}, urlParams: {}, body: {username: ""}})
.then(res =>
{
	if(res.error)
	{
		return 0;
	}

	if(res.result.status === 409)
	{
		res.result
		res.result.body.column;
		return 0;
	}

})

export default SDK;
