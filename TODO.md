- El IFetchHandler esta anticuado... hay que hacer que resiba un tipo de endpoint mas espesífico... para estos efectos propongo crear un helper en Endpoint tipo ComposeEndpoint<ReqSemasUnion, ResShemasUnion> o similar... que te devuelva el endpoint que estás bu

- El response de jpeg_image hay que verificar que el tipo de stream que retorna el usuario sea del mimetype correcto
