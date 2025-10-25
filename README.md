# Lapiz

La idea de este proyecto es evitar la duplicación de código frontend - backednd relacionado con las llamadas al servidor en aplicaciónes web. Además en un futuro planeo autogenerar documentación para APIs construidas con lapiz.

El archivo principal de lapiz debe ser lapiz.js y será donde comenzemos a construir nuestra librería. Este archivo debe declarar endponits y exportarlos dentro de un objeto plano similar al siguiente ejemplo:

```js
const Lapiz = require("lapiz");
const {z} = require("zod");

const getAnimals = Lapiz.declareEndpoint.get("/get-animals", {
	response : z.union([
		z.object({
			status: z.literal(200),
			headers: z.object({
				"Content-Type": z.literal("application/json"), //o Lapiz.contentTypes.applicationJson
			}),
			body: z.array().string() //como se haga en zod... ahora no recuerdo como es
		}),
		z.object({
			status: z.literal(500),
			headers: z.object({
				"Content-Type": z.literal("text/plain"),
			}),
			body: z.string()
		})
	])
});

module.exports = { getAnimals };
```

Luego documentaré con más detalle la interface que acepta Lapiz.declareEndpoint, pero a grandes razgos sería así una librería declaratiba.

Luego desde terminal se debe construir la librería con:

```bash
npm --prefix ./node_modules/lapiz run build -- lapiz.js
```

# lapiz-front

Esto te creará o sobre escribirá una carpeta ./lapiz-front y ./lapiz-back

dentro de ./lapiz-front/index.js tendremos las declaraciones para llamar al endpoint desde el front ya listo para usar:

```javascript
export getAnimals = () => fetch("/get-animals", bla bla bla).
```

Estará correctamente tipado para ingresar lo que la request nesecite para ser armada. estas funciones serán asincronas. Fallarán (reject) solo cuando el programador no siga las reglas declaradas en lapiz.js, por lo que no es un error que haya que capturar, sino que programar correctamente para evitar.

```javascript
import * as LapizCall from "./lapiz-front"; //o donde esté relatibo a tu proyecto

const call = await LapizCall.getAnimals();

if(call.error) 
{
	//manejo de errores en fetch() --> como error de red u otros
	//manejo de errores en los tipos pasados como param (es decir que no se mandó el fetch porque los tipos no coinciden
	return;
}
call.result.forEach(etc);
```

# lapiz-back

La parte del backend construye un endpoint en express que valida los tipos de la entrada en el servidor y tiene una respuesta standart en caso de que estén mal.

Importa un archivo que debe ser rellenado por el usuario de la librería, ejecuta la declaración del usuario y responde (si la declaración del usuario falla retorna un status 500 standart.

```javascript
const express = require("express");
const userLogic = require("../user-logic.js");
const router = express.Router();

router.use((req, res, next, err) => manejo de errores);

router.get("/get-animals", (req, res) =>
{
	// validación de tipos de la req

	const handlerResult = userLogic.getAnimalls(/*parametros si es que lo hubiera*/);
	
	res.status(handleResult.status).json(handleResult.body);
});

/**@param {import("express").Application} app*/
const applyAPI = app =>
{
	app.use(router);
	return void 0;
}

module.exports = applyAPI;
```

el archivo user-logic.js (debo renombrarlo) debe exportar un objeto con los metodos nesesarios para que lapiz-back funcióne. Para tener tipado automático se debe importar el modulo lapiz-back/callback-declarations.

```javascript
const callbackDeclarations = require("./lapiz-back/callback-declarations");

callbackDeclarations.getAnimalls(({req, res}) =>
{
	//tu logica
	//req tiene datos bien tipados
	//res no se debe usar casi nunca, pero se expone por si quieres setear alguna cookie ao característica aun no sopratada por lapiz

	return {
		status: 200,
		body: ["perro", "gato", "vaca", "simio"]
	}
});

module.exports = callbackDeclarations;
```

callbackDeclarations te forzará el tipado correcto de los parametros y del return (si tienes jsconfig.json, obivo).

## uso

La gracia es que puedes convertir este software en un paquete npm que luego puedes importar para acoplar a tu api de express y para llamar a la misma api desde el javascript del cliente.

```javascript
//back
const miApiDeAnimales = require("mi-paquete/lapiz-back");
const express = require("express");

const app = express();

miApiDeAnimales(app);

app.listen(3000, () => console.log("escucahndo el puerto 300");
```
```javascript
//front
import apiAnimales from "mi-paquete/lapiz-front"

await apiAnimales.getAnimalls();
```

Así te evitas estar duplicando la lógica de validación de tipos y errores inesperados y te desligas de los nombres de urls así como de los tipos de transporte.

Toda tu lógica más elemental estará declarada en lapiz.js.

si cambias el archivo lapiz.js y reconstruyes solo se alteraran los archivos autogenerados. por eso es importante no tocarlos. solo interactuar con ellos desde otros archivos. 

## Recomendación

para asegurarte de que exportas el objeto completo y correctamente en user-logic.js puedes añadir una declaración jsDocs al objeto antes de exportarlo, así te marcara error si no lo has rellenado correctamente.

Esto te permite crear tus declaraciónes de lógica en cualquier archivo e importar todo en user-logic asegurandote de exportar el objeto correcto. Además puedes pedir a typescript que te revise los típos a ver si tiene alguna queja.
