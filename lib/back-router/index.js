const Lapiz = require("../../index");
const express = require("express");
/**
 * @typedef {(req: express.Request, res: express.Response, next?: express.NextFunction) => any} Middelware
 */
/*** @template {string}URL @template {Lapiz.Endpoint<URL>}E @typedef {(request:E["request"], expressRaw: { req: express.Request; res: express.Response })=>Promise<E["response"]>|E["response"]} BackImplementation*/
 /**
  * @type {<URL extends string, ER extends Record<string, Lapiz.Endpoint<URL>>>(endpoint: ER, endpointsBackImplementationsRecord: {[K in keyof ER]: BackImplementation<ER[K]["constants"]["url"], ER[K]>}) => any}
 */
const makeRouter = (endpointsRecord, endpointsBackImplementationsRecord) =>
{
	const router = express.Router();
	
	Object.entries(endpointsRecord).forEach(([key, endpoint]) =>
	{
		if(endpoint.constants.method === "GET")
		{
			//TODO: ver el midelware de body
			router.get(endpoint.constants.url, (req, res) =>
			{
				const reqToConfirmation = {
					headers: req.headers,
					urlParams: req.params,
					body: req.body
				};
				const reqConfirmation = endpoint.request.safeParse(reqToConfirmation);

				if(reqConfirmation.error)
				{
					//responder un standart
					return;
				}
				
				const userResPromise = new Promise((resolve, reject) =>
				{
					const userRes = endpointsBackImplementationsRecord[key](reqConfirmation.data, {req, res});

					if(userRes instanceof Promise)
					{
						userRes
						.then(resolve)
						.catch(reject)

						return;
					}
					resolve(userRes);	
				});

				userResPromise.then(userRes =>
				{
					const resConfirmation = endpoint.response.safeParse(userRes);
				
					if(resConfirmation.error)
					{
						
						return;
					}
					res.status(resConfirmation.data.status)

					//enviar con metodos con un switch segun content type y un headers seteado
				})

			});
		}
	});
}
