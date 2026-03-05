/**
 * @file
 * @source lib/types/backend.d.ts
 */
import {RouteParameters} from "express-serve-static-core";
import * as NodeStream from "node:stream";
type BinaryMimeType =
  | "application/octet-stream"
  | "application/pdf"
  | "application/zip"
  | "application/x-rar-compressed"
  | "application/x-7z-compressed"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "audio/mpeg"
  | "audio/wav"
  | "video/mp4";

export type LapizReqVOID<R extends string = string> =
{
	routeParams: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	"content-type"?: never;
	body?: never;
}
export type LapizReqTEXT<R extends string = string> = {
	routeParams: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	"content-type": "text/plain";
	body: string;
}
export type LapizReqJSON<R extends string = string> = {
	routeParams: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	"content-type": "application/json";
	body: Object;
}
export type LapizReqBLOB<R extends string = string> = {
	routeParams: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	"content-type": BinaryMimeType;
	body: NodeStream.Readable;
}
export type LapizReq<R extends string = string> = 
	LapizReqVOID<R>|
	LapizReqTEXT<R>|
	LapizReqJSON<R>|
	LapizReqBLOB<R>
;

export type LapizResVOID =
{
	status: number;
	headers?: Record<string, string>;
	"content-type"?: never;
	body?: never;
}
export type LapizResTEXT =
{
	status: number;
	headers?: Record<string, string>;
	"content-type": "text/plain";
	body: string;
}
export type LapizResJSON =
{
	status: number;
	headers?: Record<string, string>;
	"content-type": "application/json";
	body: Object;
}
export type LapizResBLOB =
{
	status: number;
	headers?: Record<string, string>;
	"content-type": BinaryMimeType;
	body: NodeStream.Readable;
}
export type LapizRes = LapizResVOID|LapizResTEXT|LapizResJSON|LapizResBLOB;
