# Lapiz

Lapiz (`lapiz`) es una librería de clases para estandarizar endpoints de una API tanto en backend como en frontend.

## Instalación

```bash
npm i lapiz
```

---

## Patrón de errores rápidos

En tanto `RouteHandler.handle()` como `ApiCaller.parseOutput()`, en vez de retornar la respuesta completa, podés retornar un error rápido:

```javascript
// RouteHandler.handle()
return RouteHandler.Error.BadRequest("Input inválido");
// o
return RouteHandler.Error.Forbidden("No autorizado");
// o
return RouteHandler.Error.InternalServerError("Error de base de datos");
// o
return RouteHandler.Error.NotFound("No se encuentra el recurso");

// ApiCaller.parseOutput()
return new ApiCaller.Error.BadResponse("Respuesta inesperada");
```

---

## ApiCaller (frontend)

Un `ApiCaller` es una clase abstracta que debés extender para definir cómo se llama a cada endpoint de tu API desde el frontend. Debés implementar dos métodos:

- `buildReq(input)` — construye el objeto de request a partir del input
- `parseOutput(rawRes, extra)` — transforma la respuesta cruda en el output final

### Pipeline de errores

Cuando llamás `sdk.call("endpoint", input)`, Lapiz maneja los errores automáticamente:

```
fetch()
  ├─ Falló red/fetch          → FetchError
  ├─ Server respondió con headers de error (bad-request, forbidden, internal-server-error)
  │                            → el LapizFrontendError correspondiente
  ├─ No se pudo parsear el body de la respuesta (JSON/text inválido)
  │                            → ParseError
  └─ Todo OK                 → se llama parseOutput()
                                    └─ Si respuesta es inesperada → BadResponse()
```

**Punto clave:** Para cuando se llama `parseOutput()`, todos los errores típicos ya fueron filtrados. El único error que `parseOutput()` debería retornar es `BadResponse()` cuando la respuesta del servidor no coincide con lo que esperás.

### Ejemplo

```javascript
import ApiCaller from "lapiz/api-caller"
import { hostName } from "./constants.js"

/**
 * @typedef {"create-pig"} Name
 * @typedef {"/create-pig/:name"} Route
 * @typedef {{ name: string; age: number; }} Input
 * @typedef {{ success: true; error: null; } | { success: false; error: Error; }} Output
 * @typedef {{ "content-type": "application/json"; routeParams: { name: string }; body: { age: number } }} Req
 * @typedef {{ status: 200 | 500 }} Res
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
		// Si llegamos hasta aquí, la respuesta tiene status 200 y content-type válido
		// Solo verificamos que el body sea lo que esperamos
		if(extra.contentType !== "application/json")
		{
			return new ApiCaller.Error.BadResponse("Se esperaba respuesta JSON");
		}

		const body = extra.body;
		if(typeof body.success !== "boolean")
		{
			return new ApiCaller.Error.BadResponse("Forma del body inesperada");
		}

		// Happy path - retornamos el output parseado
		return { success: body.success, error: null };
	}
}

export default CreatePig;
```

Hay cuatro variantes según el método HTTP: `ApiCaller.GET`, `ApiCaller.POST`, `ApiCaller.PUT`, `ApiCaller.DELETE`.

---

## RouteHandler (backend)

El `RouteHandler` es el equivalente al `ApiCaller` pero en el servidor. Debés implementar tres métodos:

- `parseInput(expressReq)` — extrae y valida el input del request de Express. Retorna el input o un error rápido (`RouteHandler.Error.BadRequest`).
- `handle(input, extra)` — contiene la lógica del endpoint. Retorna el output O un error rápido (`RouteHandler.Error.BadRequest`, `RouteHandler.Error.Forbidden`, `RouteHandler.Error.InternalServerError`).
- `buildRes(output, extra)` — construye el objeto de respuesta `LapizRes` a partir del output.

### Errores rápidos

En `handle()`, en vez de retornar el output, podés retornar un error rápido:

```javascript
async handle(input, extra)
{
	const existingPig = await db.findPig(input.name);
	if(existingPig)
	{
		return RouteHandler.Error.BadRequest("El cerdo ya existe");
	}

	if(!extra.expressReq.user?.isAdmin)
	{
		return RouteHandler.Error.Forbidden("Solo admins pueden crear cerdos");
	}

	const result = await db.insertPig(input.name, input.age);
	if(!result)
	{
		return RouteHandler.Error.InternalServerError("Error de base de datos");
	}

	return { success: true }; // Output de éxito
}
```

### Ejemplo

```javascript
const RouteHandler = require("lapiz/route-handler");

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
			return new RouteHandler.Error.BadRequest("El campo 'age' debe ser un número");
		}
		return {
			name: rawExpressReq.params.name,
			age: rawExpressReq.body.age
		};
	}

	async handle(input, extra)
	{
		// Lógica de negocio - puede retornar output O un error rápido
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

## Tipos de errores

### Errores de backend (`LapizBackendError`)

Usados en `RouteHandler`:

- `RouteHandler.Error.BadRequest` — 400, input inválido
- `RouteHandler.Error.Forbidden` — 403, no autorizado
- `RouteHandler.Error.InternalServerError` — 500, fallo inesperado del servidor

### Errores de frontend (`LapizFrontendError`)

Retornados por `sdk.call()`:

- `ApiCaller.Error.FetchError` — falló red/fetch (sin conexión, CORS, timeout)
- `ApiCaller.Error.BadRequest` — el server respondió con 400
- `ApiCaller.Error.Forbidden` — el server respondió con 403
- `ApiCaller.Error.InternalServerError` — el server respondió con 500
- `ApiCaller.Error.ParseError` — no se pudo parsear el body de la respuesta
- `ApiCaller.Error.BadResponse` — `parseOutput()` detectó un formato de respuesta inesperado

---

## Consideraciones sobre tipos de body

Cuando el `content-type` es `application/json`, `text/plain`, o no hay cuerpo (`void`), los tipos de `Req` y `Res` son idénticos entre frontend y backend.

Para contenido binario (`BinaryMimeType`), el tipo del `body` difiere:

| Lado | Tipo de `body` en `Req` | Tipo de `body` en `Res` |
|------|------------------------|------------------------|
| Frontend | `BodyInit` (`File`, `Blob`, etc.) | `ReadableStream` |
| Backend | `import("node:stream").Readable` | `import("node:stream").Readable` |

---

## Notas adicionales

Actualmente, los métodos GET y DELETE en routeHandler no lanzan error si reciben un body. Asegurate de no usar contentType ni body en estos métodos, ya que esto puede llevar a errores silenciosos.
