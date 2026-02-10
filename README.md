# Lapiz

Lapiz es una librería de javascript para dibujar apis (Lek - Api'z), basada en zod y express.

La principal intención es permitir una construcción flexible de apis y generar implemntaciones de backend y sdk's para el frontend sin duplicar lógica de validaciones.

## Instalación

Para instalar lapiz en tu proyecto 
```bash
npm i lapiz
```

## Lapiz

El modulo principal es una class con metodos estáticos. El principal es declareEndpoint, pero también hay metodos y propiedades de utilidad.

```javascript
const Lapiz = require("lapiz");
const {z} = require("zod");

const ep1 = Lapiz.declareEndpoint.put("crear-usuario", "/create/user/:username", {
	request: z.object({
		contentType: Lapiz.contentTypeSchemas.applicationJson,
		urlParams: z.object({
			username: z.string()
		}),
		headersParams: z.object({
			"my-extra-param": z.union([z.literal("opt1"), z.literal("opt2")])
		}),
		body: z.object({
			email: z.string(),
			password: z.string(),
			age: z.number(),
			gender: z.union([z.literal("F"), z.literal("M")])
		})
	}),
	response: z.union([
		z.object({
			contentType: Lapiz.contentTypeSchemas.void,
			status: z.literal(200),
			headersParams: z.object({}),
			body: z.undefined()
		}),
		z.object({
			contentType: Lapiz.contentTypeSchemas.textPlain,
			status: z.literal(500),
			headersParams: z.object({}),
			body: z.union([z.literal("unexpected error"), z.literal("a tipical error")])
		})
	]);
});

const ep2 = Lapiz.declareEndpoint.delete("delete-user", "/delete/user/:user_id", {
	...
})
module.exports = { ep1, ep2 };
```

Como puedes ver en el ejemplo tenemos una función declarativa que retorna un objeto Endpoint. declareEndpoint tiene metodos get, put, post y delete. Estos metodos requieren varios parametros:

#### name
el nombre del endpoint es un string que lo identifique. El usuario debe pensar bien en que nombre poner para evitar conficiones futuras.

#### url
La url es un string con formato de url de express... puedes poner parametros con `:` ej: `/my/url/:param1/:param2`

#### declarations
Este tercer parametro es un objeto con 2 propiedades. request y response. ambas deben ser zodTypes con ciertas reglas.

##### request
en el caso de request hay que poner un contentType que debe ser un zod literal de los contentType validos. Para evitar problemas Lapiz.contentTypesSchemas es un objeto con los schemas validos.
(En el caso de get y delete deben ser Lapiz.contentTypeSchemas.void de forma obligatoria dada la naturaleza de estos metodos http).
request tambien requiere urlParams que debe corresponderse con los parametros de la url, headersParams que está pensado para parametros extra a enviar en los headers. No son los headers reales, solo parametros extra
además se requiere un body. este dependerá del contentType del request.

si es textPlain, ZodType<string>;
si es void, z.undefined();
si es applicationJson, ZodType<Object>;
si es imageJpeg, debe ser Lapiz.symbols.imageJpeg de forma obligatoria

##### response
tambien pide un contentType
pide un status que debe ser un ZodType<number> (hay un listado muy util en Lapiz.resStatusSchemas)
pide un headersParams igual que en request y un body igual
---
La gracia de todo este asunto es ser espesífico y aprobechar las ZodUnion's.

Las declaraciones es recomendable exportarlas desde un archivo unico que será nuestra fuente de verdad.

## SDK

es una class que crea un sdk para el frontend de forma muy simple.

ej:

```javascript
import SDK from "lapiz/sdk";
import {ep1, ep2} from "./mis-endpoints";

const sdk = new SDK(ep1, ep2);

const res = await sdk.call("create-user", {
	contentType: "application/json"
	urlParams: { username: "JohnLennon" },
	headersParams: { "my-extra-params": "opt2" },
	body: { email: "john@lennon.com", password: "hola1234", age: 44, gender: "M" }
});

if(res.error)
{
	alert(error.message);
}
else
{
	console.log(res.result.body) //undefined
}
```

La gracia es que todo esta tipado de forma inteligente, por lo que te puedes dejar llevar por el lsp.

hay que pasar los endpoints al constructor de SDK con new
el primer parametro del metodo call es el nombre del endpoint y luego te pedirá un objeto congruente con tu endpoint.request
retornará un objeto con propiedad error o result.

### LapizBackend

Es para implemntar tus endpoints en el servidor.

```javascript
const LapizBackend = require("lapiz/backend");
const {ep1, ep2} = require("./mis-endpoints");

const implementation1 = LapizBakcend.implements(ep1, async({ contentType,urlParams, headersParams, body }, { expressReq, expressRes }) =>
{
	bla bla bla

	debes retornar un objeto consistente con endpoint.response
})
const implamentation2 = LapizBackend.implements(ep2, ...);

const backend = new LapizBackend(implementation1, implementation2);

backend.router;		//express.Router
```

De esta forma tambien super bien tipado y facil de implementar. luego el router lo debes acoplar a un express.App

ej:

```javascript
app.use(backend.router);
```

Los parametros de LapizBackend.implements son el endpoint, un objeto relacionado con en endpoint request y además hay un objeto con los res y req de express directamente por si debese setear alguna cookie u hacer algo más avanzado... lo importante de esto es que no hagas res.send() o res.status() o res.json o fallará
## Consideraciones

Esta es una versión beta, hay que probar bien todo antes de pasar a producción y notificar en caso de encontrar errores de lógica en lapiz.

Cuidado con los headersParams. combiene no usarlo mucho, solo con objetos vacios, y siempre en lowercase porque los headrs no son caseSensitive.

la librería esta pensada para rejectar errores del programador solamente. En caso de ser errores esperados se retorna un Lapiz.Error, la filosofía detras es que throw es para la exepciones, no para el control de flujo. Es decir, no esta pensado para capturar errores con try catch. los errores de lapiz deben saltar y corregirse.

Hay una propiedad en Lapiz.Error message muy util para ventanas que vea el usuario. si quieres hacer un mensaje custom puedes usar Lapiz.setCustomErrorMessages()

ej:

```javascript
//en el archivo principal de las declaraciones

Lapiz.setCustomErrorMessages({
	invalidRequest: "Has ingresado una peticion invalida",
	fetch: "Error de red",
	clientParseBody: "Error de tipos de la request",
	unexpected: "Error inesperado"
});

```

luego si te llega un error puedes usar ese valor para un log o alert

Tambien puedes usar condicionales tipo
```javascript
if(result.error instanceof Lapiz.Error.InvalidRequest)
{
	//...
}
```

Quizas es un poco verboso pero es seguro. puedes envolver el sdk en uno más conciso de forma muy simple o añadir endpoints con tu app de express
