import { request } from "express";
import Lapiz from "../../index.js";
import LapizError from "../lapiz-error/index.js";
import {z} from "zod";

/**
 * @typedef {import("../lapiz-error")} LapizError
 */

/*** @template E @typedef {E extends {request: z.ZodTypeAny} ? z.infer<E["request"]> : never} ReqOf*/
/*** @template E @typedef {E extends {response: z.ZodTypeAny} ? z.infer<E["response"]> : never} ResOf*/

/**
 * @template {string}Url
 * @template {Lapiz.Declarations<Url>}D
 * @template {Lapiz.Endpoint<Url, D>}E
 * @param {E} endpoint
 * @param {ReqOf<E>} request
 * @returns {Promise<ResOf<E>|LapizError>}
 */
const caller = (endpoint, request) =>
{
	const reqConfirmation = endpoint.request.safeParse(request);

	if(reqConfirmation.error)
	{
		return Promise.resolve(new LapizError("validation error"));
	}

	const contentType = reqConfirmation.data.headers["Content-Type"];

	const realBody =
		contentType === "application/json" ? JSON.stringify(reqConfirmation.data.body) :
		contentType === "text/plain" && typeof reqConfirmation.data.body === "string" ? reqConfirmation.data.body :
		undefined
	;

	return fetch(endpoint.constants.url, {
		method: endpoint.constants.method,
		headers: reqConfirmation.data.headers,
		body: realBody
	})
	.then(res =>
	{
		/** @type {{ current: null|Promise<string|object|void> }}*/
		const bodyRefPromise = { current: null };
		const resHeaders = Object.fromEntries(res.headers.entries());

		if(resHeaders["Content-Type"] === "application/json")
		{
			bodyRefPromise.current = res.json();
		}
		else if(resHeaders["Content-Type"] === "text/plain")
		{
			bodyRefPromise.current = res.text();
		}
		else
		{
			bodyRefPromise.current = Promise.resolve(void 0);
		}

		bodyRefPromise.current.then(resBody =>
		{
			const rearmedResponse = {
				status: res.status,
				headers: res.headers,
				body: resBody
			};
			const resConfirmation = endpoint.response.safeParse(rearmedResponse);

			if(resConfirmation.error)
			{
				return Lapiz.ClientResponseValidationError; //quizas habria que rejectar mejor, ya que siempre el server debería responder con un esquema bien echo.
			}
		
			return resConfirmation.data;
		})
		.catch(err =>
		{
			return Lapiz.ClientResponseParseBodyError;
		})
	})
	.catch(err =>
	{
		return Lapiz.FetchError(err);
	});
};


//Luego aquí iteramos sobre los modulos importados de ep
//Esto será difícil de tipar pero absolutamente vale la pena
//voy a tener que crear un tipo que me transforme una declaration en una caller fn tipo ReturnType<Caller<D>>
//y luego armar un objeto que tenga las mismas keys que declarationsModule pero que sus values pasen por este helper

/**
 * @template {Record<string, any>}ER
 * @typedef {{ [K in keyof ER]: (request: ReqOf<ER[K]>) => Promise<ResOf<ER[K]>> }} CallerRecord
*/

/**
 * @typedef {<ER extends Record<string, any>>(endpointsRecord: ER) => CallerRecord<ER>} MakeApiCallerFn
 * @type {MakeApiCallerFn}
 */
const makeAPICallers = (endpointsRecord) =>
{
	/**@type {Partial<CallerRecord<typeof endpointsRecord>>}*/
	const acc = {};

	for (const key in endpointsRecord)
	{
		const endpoint = endpointsRecord[key];
		acc[key] = (request) => caller(endpoint, request);
	}
	return /**@type {CallerRecord<typeof endpointsRecord>}*/ (acc);
};

const ep = Lapiz.declareEndpoint.post("/url:param", {
	request : z.object({
		headers: z.object({
			extraParam: z.string(),
		}),
		urlParams: z.object({param : z.string()}),
		body: z.void()
	}),
	response: z.object({
		status: z.number(),
		headers: z.object({
			"Content-Type" : Lapiz.contentTypes.applicationJson
		}),
		body : z.object({
			param1: z.boolean()
		})
	})
});

const callerMaked = makeAPICallers({ ep });

callerMaked.ep({headers: { extraParam: "ste es mi param" },  urlParams: { param: "hola mundo" }, body: void 0 }).then(r => r.body.param1);
