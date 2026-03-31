
/**
 * @file
 * @source lib/endpoint-handler/index.js
 * @module lapiz/route-handler
 */

import LapizBackendError from "#module-js-lib/backend-error/index.js";

/**
 * @import {LapizReq, LapizRes, LapizReqVOID} from "#module-js-lib/types/backend.d.ts"
 * @import {Request as ExpressReq, Response as ExpressRes} from "express"
 * @import {
 *	TLapizBackendError_BadRequest
 * } from "#module-js-lib/backend-error/index.js"
 */
/**
 * @template {string}N
 * @template {string}R
 * @template I
 * @template O
 * @template {LapizReq<R>}Req
 * @template {LapizRes}Res
 * @typedef {{
 *	name: N;
 *	method: "GET"|"PUT"|"POST"|"DELETE";
 *	route: R;
 *	parseInput(expressReq: ExpressReq<R>):(
 *		I |
 *		TLapizBackendError_BadRequest |
 *		Promise<I|TLapizBackendError_BadRequest>
 *	);
 *	handle(input: I, extra: {expressReq: ExpressReq<R>, expressRes: ExpressRes}):Promise<O>|O;
 *	buildRes(output:O, extra: {expressReq: ExpressReq<R>, expressRes: ExpressRes}):Res|Promise<Res>;
 * }} IRouteHandler
 */

/**
 * @template {string}N
 * @template {string}R
 * @template I
 * @template O
 * @template {LapizReq<R>}Req
 * @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 */
const RouteHandler = class
{
	static Error = LapizBackendError;
	/**
	 * @param {N} endpointName
	 * @param {"GET"|"POST"|"PUT"|"DELETE"} endpointMethod
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointMethod, endpointRoute)
	{
		this.name = endpointName;
		this.method = endpointMethod;
		this.route = endpointRoute;
	}
	/**@type {IRouteHandler<N, R, I, O, Req, Res>["parseInput"]}*/
	parseInput(expressReq)
	{
		throw new Error("[Lapiz EndpointHandler Error]: All EndpointHandler must implement 'parseInput' method");
	}
	/**@type {IRouteHandler<N, R, I, O, Req, Res>["handle"]}*/
	handle(req)
	{
		throw new Error("[Lapiz EndpointHandler Error]: All EndpointHandler must implement 'handle' method");
	}
	/**@type {IRouteHandler<N, R, I, O, Req, Res>["buildRes"]}*/
	buildRes(output)
	{
		throw new Error("[Lapiz EndpointHandler Error]: All EndpointHandler must implement 'buidlRes' method");
	}
	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @returns {Promise<{ data: T; error: null; }|{ data: null; error: Error; }>}
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
			return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
		}
	}
	/**
	 * @param {ExpressRes} expressRes
	 * @param {LapizRes} lapizRes
	 * @returns {void}
	 */
	static send(expressRes, lapizRes)
	{
		expressRes.status(lapizRes.status);
		if(lapizRes.headers)
		{
			Object.entries(lapizRes.headers).forEach(([k, v]) =>
			{
				if(!/^[a-z0-9-]+$/.test(k)) throw new Error("[Lapiz Error]: Headers parameters of all requests must have just lowercase chars, guions or numbers ");
				expressRes.setHeader(k, v);
			});
		}
		if(!lapizRes.contentType)
		{
			expressRes.send();
			return void 0;
		}
		expressRes.contentType(lapizRes.contentType);
		if(lapizRes.contentType === "application/json")
		{
			expressRes.json(lapizRes.body);
			return void 0;
		}
		if(lapizRes.contentType === "text/plain")
		{
			expressRes.send(lapizRes.body);
			return void 0;
		}
		lapizRes.body.pipe(expressRes);
		return void 0;
	}
	/**
	 * @param {IRouteHandler<any, any, any, any, any, any>} routeHandler
	 * @returns {(expressReq: ExpressReq, expressRes: ExpressRes) => Promise<void>}
	 */
	static makeMiddelware(routeHandler)
	{
		return async(expressReq, expressRes) =>
		{
			const input = await routeHandler.parseInput(expressReq);
			if(input instanceof LapizBackendError)
			{
				expressRes.setHeader("lapiz-backend-error", "bad-request");
				expressRes.status(500);
				expressRes.send();
				return void 0;
			}

			const {data, error} = await RouteHandler.toSafe(
				routeHandler.handle(input, { expressReq, expressRes })
			);
			if(error)
			{
				console.warn("[LAPIZ WARN]: handle method throws a error: ");
				console.warn(error);
	
				expressRes.setHeader("lapiz-backend-error", "unexpected-server-error");
				expressRes.status(400);
				expressRes.send();
				return void 0;
			}

			const lapizRes = await routeHandler.buildRes(data, { expressReq, expressRes });
			return  RouteHandler.send(expressRes, lapizRes);
		}
	}
}

/**
 * @template {string}N @template {string}R
 * @template I @template O @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler<N, R, I, O, Req, Res>}
 */
const RouteHandler_GET = class extends RouteHandler
{
	/**
	 * @param {N} endpointName
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointRoute)
	{
		super(endpointName, "GET", endpointRoute);
	}
}
/**
 * @template {string}N @template {string}R
 * @template I @template O @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler<N, R, I, O, Req, Res>}
 */
const RouteHandler_PUT = class extends RouteHandler
{
	/**
	 * @param {N} endpointName
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointRoute)
	{
		super(endpointName, "PUT", endpointRoute);
	}
}
/**
 * @template {string}N @template {string}R
 * @template I @template O @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler<N, R, I, O, Req, Res>}
 */
const RouteHandler_POST = class extends RouteHandler
{
	/**
	 * @param {N} endpointName
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointRoute)
	{
		super(endpointName, "POST", endpointRoute);
	}
}
/**
 * @template {string}N @template {string}R
 * @template I @template O @template {LapizReq<R>}Req @template {LapizRes}Res
 * @class
 * @abstract
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler<N, R, I, O, Req, Res>}
 */
const RouteHandler_DELETE = class extends RouteHandler
{
	/**
	 * @param {N} endpointName
	 * @param {R} endpointRoute
	 */
	constructor(endpointName, endpointRoute)
	{
		super(endpointName, "DELETE", endpointRoute);
	}
}

RouteHandler.GET = RouteHandler_GET;
RouteHandler.POST = RouteHandler_POST;
RouteHandler.PUT = RouteHandler_PUT;
RouteHandler.DELETE = RouteHandler_DELETE;

export default RouteHandler;
