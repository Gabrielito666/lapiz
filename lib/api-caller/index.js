/**
 * @file
 * @source lib/api-caller/index.js
 * @module lapiz/api-caller
 */
import LapizFrontendError from "#lib/frontend-error/index.js";

/**
 * @import {RouteParameters} from "express-serve-static-core"
 * @import {LapizReq, LapizRes, LapizReqVOID, BinaryMimeType} from "#lib/types/frontent.d.ts"
 * @import {
 * 	TLapizFrontendError_ServerError,
 * 	TLapizFrontendError_UnexpectedResponse,
 * 	TLapizFrontendError_FetchError,
 * 	TLapizFrontendError_ParseError
 * } from "#lib/frontend-error/index.js"
 */

const BINARY_MIME_TYPES = [
	"application/octet-stream",
	"application/pdf",
	"application/zip",
	"application/x-rar-compressed",
	"application/x-7z-compressed",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"image/jpeg",
	"image/png",
	"image/gif",
	"audio/mpeg",
	"audio/wav",
	"video/mp4"
]

/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReqVOID<R>|LapizReq<R>}Req @template {LapizRes}Res
 * @typedef {{
 *	name: N;
 *	host: string;
 *	route: R;
 *	buildReq(input:I):Req;
 *	parseResFromRaw(
 *		rawRes: Response,
 *		extra:
 *			{ contentType: null, body: null } |
 *			{ contentType: "text/plain", body: string; } |
 *			{ contentType: "application/json", body: Object } |
 *			{ contentType: BinaryMimeType, body: ReadableStream|File|Blob }
 *		):Res|TLapizFrontendError_UnexpectedResponse;
 *	parseOutput(res:Res):O;
 * }} IApiCaller
 */
/**
 * @template {string}N @template {string}R @template I @template O @template Req @template Res
 * @abstract
 * @class
 * @implements {IApiCaller<N, R, I, O, Req, Res>}
 */
const ApiCaller = class
{
	static Error = LapizFrontendError;
	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @returns {Promise<{error: Error; data: null}|{error: null; data: T}>}
	 */
	static async toSafe(promise)
	{
		try
		{
			const data = await promise;
			return { data, error: null };
		}
		catch(err)
		{
			return {
				data: null,
				error: err instanceof Error ? err : new Error("unexpected to safe error" + err)
			}
		}
	}
	/**
	 * @param {N} endpointName
	 * @param {"GET"|"POST"|"PUT"|"DELETE"} endpointMethod
	 * @param {string} host
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointMethod, host, endpointRoute)
	{
		this.name = endpointName;
		/**@private*/
		this.method = endpointMethod;
		this.host = host;
		this.route = endpointRoute;
	}
	/**
	 * @template {string}R
	 * @param {string} host
	 * @param {R} route
	 * @param {RouteParameters<R>} routeParams
	 * @return {string}
	 */
	static assembleUrl(host, route, routeParams)
	{
		const withParams = Object
			.entries(routeParams)
			.reduce((acc, [k, v]) => acc.replace(`:${k}`, String(v)), /**@type{string}*/(route));
		return `${host}${withParams}`
	}
	/**
	 * @template {LapizReq<R>}Req
	 * @param {IApiCaller<any, any, any, any, Req, any>} apiCaller
	 * @param {Req} req
	 * @returns { Promise<{
	 *		error:null;
	 *		rawRes: Response;
	 *		extra:{ contentType: null; body: null }
	 *	 } | {
	 *		error: null;
	 *		rawRes: Response;
	 *		extra: { contentType: "text/plain"; body: string; }
	 * 	} | {
	 *		error: null;
	 *		rawRes: Response;
	 *		extra: { contentType: "application/json"; body: Object; }
	 * 	} | {
	 * 		error: null;
	 * 		rawRes: Response;
	 * 		extra: { contentType: BinaryMimeType; body: ReadableStream; }
	 * 	} | {
	 * 		error:
	 * 			TLapizFrontendError_ServerError |
	 * 			TLapizFrontendError_ParseError |
	 * 			TLapizFrontendError_FetchError;
	 * 	}
	 * > }
	 */
	static async fetch(apiCaller, req)
	{
		const url = ApiCaller.assembleUrl(apiCaller.host, apiCaller.route, req.routeParams||{}); const headers = new Headers();
		let body = req["content-type"] === "application/json" ? JSON.stringify(req.body) : req.body;
		if(req.headers)
		{
			Object.entries(req.headers).forEach(([k, v]) =>
			{
				if(!/^[a-z0-9-]+$/.test(k)) throw new Error("[Lapiz Error]: Headers parameters of all requests must have just lowercase chars, guions or numbers ");
				headers.set(k, v);
			});
		}
		if(req["content-type"]) headers.set("content-type", req["content-type"]);
		body
		const {data, error} = await ApiCaller.toSafe(fetch(url, { headers, body }));
		if(error) return { error: new ApiCaller.Error.FetchError("[LAPIZ ERROR]: The call to fetch fail", error) };

		if(data.headers.get("lapiz-backend-error"))
		{
			return {
				error: new ApiCaller.Error.ServerError("[LAPIZ ERROR]: Server returns a unexpected error")
			}
		}

		const resContentType = data.headers.get("content-type");

		if(!resContentType || data.body === null)
		{
			return {
				error: null,
				rawRes: data,
				extra: {
					contentType: null,
					body: null
				}
			};
		}
		if(resContentType === "application/json")
		{
			const parsed = await ApiCaller.toSafe(data.json());
			if(parsed.error) return { error: new ApiCaller.Error.ParseError("[LAPIZ ERROR]: Error when try parse the body with res.json()", parsed.error) }
			return {
				error: null,
				rawRes: data,
				extra: {
					contentType: "application/json",
					body: parsed.data
				}
			}
		}
		if(resContentType === "text/plain")
		{
			const parsed = await ApiCaller.toSafe(data.text());
			if(parsed.error) return { error: new ApiCaller.Error.ParseError("[LAPIZ ERROR]: Error when try parse the body with res.text()", parsed.error) }

			return {
				error: null,
				rawRes: data,
				extra: {
					contentType: "text/plain",
					body: parsed.data
				}
			}
		}
		if(!BINARY_MIME_TYPES.includes(resContentType))
		{
			throw new Error(`Lapiz not support mimetype "${resContentType}" yet`);
		}
		return {
			error: null,
			rawRes: data,
			extra: {
				contentType: /**@type {BinaryMimeType}*/(resContentType),
				body: data.body
			}
		}
	}
	/**
	 * @template I
	 * @template O
	 * @param {IApiCaller<any, any, I, O, any, any>} apiCaller
	 * @param {I} input
	 * @returns {Promise<{
	 * 	output: O;
	 * 	error: null
	 * } | {
	 * 	output: null;
	 * 	error:
	 * 		TLapizFrontendError_ServerError |
	 * 		TLapizFrontendError_FetchError |
	 * 		TLapizFrontendError_ParseError
	 * }>} 
	 */
	static async call(apiCaller, input)
	{
		const req = apiCaller.buildReq(input);
		const fetchCall = await ApiCaller.fetch(apiCaller, req);
		if(fetchCall.error)
		{
			return {
				error: fetchCall.error,
				output: null
			}
		};

		const res = apiCaller.parseResFromRaw(fetchCall.rawRes, fetchCall.extra);
		if(res instanceof ApiCaller.Error.UnexpectedResponse)
		{
			console.warn("[LAPIZ WARN]: Server send a unexpected response: ", res.message);
			return {
				error: res,
				output: null
			}
		}
		return {
			error: null,
			output: apiCaller.parseOutput(res)
		};
	}

	/**@type {IApiCaller<N, R, I, O, Req, Res>["buildReq"]}*/
	buildReq(input)
	{
		throw new Error("[Lapiz ApiCaller Error]: All ApiCaller instances must implements 'buildReq'");
	}

	/**@type {IApiCaller<N, R, I, O, Req, Res>["parseResFromRaw"]}*/
	parseResFromRaw(rawRes)
	{
		throw new Error("[Lapiz ApiCaller Error]: All ApiCaller instances must implements 'buildResFromRaw'");
	}
	/**@type {IApiCaller<N, R, I, O, Req, Res>["parseOutput"]}*/
	parseOutput(res)
	{
		throw new Error("[Lapiz ApiCaller Error]: All ApiCaller instances must implements 'parseRes'");
	}
}

/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReqVOID<R>}Req @template {LapizRes}Res
 * @typedef {IApiCaller<N, R, I, O, Req, Res>} IApiCaller_GET
 */
/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReqVOID<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IApiCaller_GET<N, R, I, O, Req, Res>}
 * @extends {ApiCaller<N, R, I, O, Req, Res>}
 */
const ApiCaller_GET = class extends ApiCaller
{
	/**
	 * @param {N} endpointName
	 * @param {string} host
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, host, endpointRoute)
	{
		super(endpointName, "GET", host, endpointRoute);
	}
}
/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReqVOID<R>}Req @template {LapizRes}Res
 * @typedef {IApiCaller<N, R, I, O, Req, Res>} IApiCaller_DELETE
 */

/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReqVOID<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IApiCaller_DELETE<N, R, I, O, Req, Res>}
 * @extends {ApiCaller<N, R, I, O, Req, Res>}
 */
const ApiCaller_DELETE = class extends ApiCaller
{	
	/**
	 * @param {N} endpointName
	 * @param {string} host
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, host, endpointRoute)
	{
		super(endpointName, "DELETE", host, endpointRoute);
	}
}

/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IApiCaller<N, R, I, O, Req, Res>}
 * @extends {ApiCaller<N, R, I, O, Req, Res>}
 */
const ApiCaller_PUT = class extends ApiCaller
{
	/**
	 * @param {N} endpointName
	 * @param {string} host
	 * @param {R} endpointRoute
	 */

	constructor(endpointName, host, endpointRoute)
	{
		super(endpointName, "PUT", host, endpointRoute);
	}
}

/**
 * @template {string}N @template {string}R @template I @template O
 * @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IApiCaller<N, R, I, O, Req, Res>}
 * @extends {ApiCaller<N, R, I, O, Req, Res>}
 */
const ApiCaller_POST = class extends ApiCaller
{
	/**
	 * @param {N} endpointName
	 * @param {string} host
	 * @param {R} endpointRoute
	 */

	constructor(endpointName, host, endpointRoute)
	{
		super(endpointName, "POST", host, endpointRoute);
	}
}

ApiCaller.GET = ApiCaller_GET;
ApiCaller.PUT = ApiCaller_PUT;
ApiCaller.POST = ApiCaller_POST;
ApiCaller.DELETE = ApiCaller_DELETE;

export default ApiCaller;
