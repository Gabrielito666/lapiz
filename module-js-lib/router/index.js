import RouteHandler from '#module-js-lib/route-handler/index.js'
import express from 'express'

/**
 * @import {IRouteHandler} from "#module-js-lib/route-handler/index.js"
 * @import {Application} from "express"
 */

/**
 * @class
 */
const Router = class
{
	/**
	 * @param {...IRouteHandler<any, any, any, any, any, any>} routeHandlers
	 */
	constructor(...routeHandlers)
	{
		this.expressRouter = express.Router();
		this.expressRouter.use(express.json());
		this.expressRouter.use(express.text());

		routeHandlers.forEach(rh =>
		{	
			const method = /**@type {"get"|"put"|"post"|"delete"}*/(rh.method.toLowerCase());
			const midd = RouteHandler.makeMiddelware(rh);
			this.expressRouter[method](rh.route, midd);
		});
	}
	/**
	 * @param {Application} app
	 * @returns {void}
	 */
	addToApp(app)
	{
		app.use(this.expressRouter);
		return void 0;
	}
}

export default Router;
