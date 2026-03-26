# Lapiz

Lapiz (o `lek-apis`) es una librería de clases para estandarizar endpoints de una API tanto en backend como en frontend.

## Instalación

```bash
npm i lapiz
```

---

## ApiCaller (frontend)

Un `ApiCaller` es una clase abstracta que debes extender para definir cómo se llama a cada endpoint de tu API desde el frontend. Debes implementar tres métodos:

- `buildReq(input)` — construye el objeto de request a partir del input.
- `parseOutput(rawRes, extra)` — transforma el la respuesta cruda en el output final que recibirá el consumidor del SDK.

```javascript
import ApiCaller from "lapiz/api-caller"
import LapizFrontendError from "lapiz/frontend-error"
import { hostName } from "./constants.js"

/**
 * @typedef {"create-pig"} Name
 * @typedef {"/create-pig/:name"} Route
 * @typedef {{ name: string; age: number; }} Input
 * @typedef {{ success: true; error: null; } | { success: false; error: Error; }} Output
 * @typedef {{ "content-type": "application/json"; routeParams: { name: string }; body: { age: number } }} Req
 * @typedef {{ status: 200 | 500 }} Res
 */

/**
 * @import {IApiCaller} from "lapiz/api-caller"
 */

/**
 * @class
 * @extends {ApiCaller.PUT<Name, Route, Input, Output, Req, Res>}
 * @implements {IApiCaller<Name, Route, Input, Output, Req, Res>}
 */
const CreatePig = class extends ApiCaller.PUT
{
	constructor()
	{
		super("create-pig", hostName, "/create-pig/:name");
	}

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["buildReq"]} */
	buildReq(input)
	{
		return {
			"content-type": "application/json",
			routeParams: { name: input.name },
			body: { age: input.age }
		}
	}

	/** @type {IApiCaller<Name, Route, Input, Output, Req, Res>["parseOutput"]} */
	parseOutput(rawResponse, extra)
	{
		if(rawResponse.status === 200) return { success: true, error: null };
		if(rawResponse.status === 500) return {
			success: false,
			error: new Error("Error al crear el cerdo")
		};

		return new ApiCaller.Error.UnexpectedResponse("Respuesta inesperada del servidor");
	}
}

export default CreatePig;
```

Hay cuatro variantes según el método HTTP: `ApiCaller.GET`, `ApiCaller.POST`, `ApiCaller.PUT`, `ApiCaller.DELETE`.

---

## SDK (frontend)

El `SDK` agrupa varios `ApiCaller`s y expone un método `call(name, input)` con tipado inferido automáticamente.

```javascript
import SDK from "lapiz/sdk";
import CreatePig from "./create-pig.js"

const sdk = new SDK(
	new CreatePig(),
	// ...más callers
);

(async () =>
{
	const res = await sdk.call("create-pig", { name: "oink", age: 66 });

	if(res.error)
	{
		console.error(res.error); // LapizFrontendError con el problema
	}
	else
	{
		console.log(res.output); // { success: true; error: null } | { success: false; error: Error }
	}
})();
```

---

## RouteHandler (backend)

El `RouteHandler` es el equivalente al `ApiCaller` pero en el servidor. Debes implementar tres métodos:

- `parseInput(expressReq)` — extrae y valida el input del request de Express. Retorna el input o un `LapizBackendError.BadRequest`.
- `handle(input, extra)` — contiene la lógica del endpoint. Retorna el output.
- `buildRes(output, extra)` — construye el objeto de respuesta `LapizRes` a partir del output.

```javascript
const RouteHandler = require("lapiz/route-handler");
const LapizBackendError = require("lapiz/backend-error");

/**
 * Los tipos (N, R, I, O, Req, Res) son los mismos que en el ApiCaller del frontend.
 *
 * @implements {IRouteHandler<N, R, I, O, Req, Res>}
 * @extends {RouteHandler.PUT<N, R, I, O, Req, Res>}
 */
const CreatePig = class extends RouteHandler.PUT
{
	constructor()
	{
		super("create-pig", "/create-pig/:name");
	}

	parseInput(rawExpressReq)
	{
		if(typeof rawExpressReq.body.age !== "number")
		{
			return new LapizBackendError.BadRequest("El campo 'age' debe ser un número");
		}
		return {
			name: rawExpressReq.params.name,
			age: rawExpressReq.body.age
		};
	}

	async handle(input)
	{
		await myDatabase.insertPig(input.name, input.age);
		return { success: true, error: null };
	}

	buildRes(output)
	{
		return {
			status: output.success ? 200 : 500
		};
	}
}

module.exports = CreatePig;
```

Hay cuatro variantes: `RouteHandler.GET`, `RouteHandler.POST`, `RouteHandler.PUT`, `RouteHandler.DELETE`.

---

## Router (backend)

El `Router` recibe una lista de `RouteHandler`s y los registra en una aplicación Express.

```javascript
const Router = require("lapiz/router");
const express = require("express");
const CreatePig = require("./create-pig.js");

const router = new Router(
	new CreatePig(),
	// ...más handlers
);

const app = express();
router.addToApp(app);
app.listen(3000, () => { console.log("Escuchando en localhost:3000") });
```

---

## Consideraciones sobre tipos de body

Cuando el `content-type` es `application/json`, `text/plain`, o no hay cuerpo (`void`), los tipos de `Req` y `Res` son idénticos entre frontend y backend.

Para contenido binario (`BinaryMimeType`), el tipo del `body` difiere:

| Lado | Tipo de `body` en `Req` | Tipo de `body` en `Res` |
|------|------------------------|------------------------|
| Frontend | `BodyInit` (`File`, `Blob`, etc.) | `ReadableStream` |
| Backend | `import("node:stream").Readable` | `import("node:stream").Readable` |

---

## Manejo de errores

Todos los errores que puede retornar `sdk.call()` son instancias de `LapizFrontendError`:

- `LapizFrontendError.FetchError` — falló la llamada a `fetch` (sin conexión, CORS, etc.).
- `LapizFrontendError.ServerError` — el servidor retornó el header `lapiz-backend-error`.
- `LapizFrontendError.ParseError` — error al parsear el cuerpo de la respuesta.
- `LapizFrontendError.UnexpectedResponse` — `parseResFromRaw` retornó una respuesta no contemplada.
