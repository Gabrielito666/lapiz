/**
 * @file
 * @source lib/types/frontend.t.ts
 */
import {RouteParameters} from "express-serve-static-core";

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
	routeParams?: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	contentType?: never;
	body?: never;
}
export type LapizReqTEXT<R extends string = string> = {
	routeParams?: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	contentType: "text/plain";
	body: string;
}
export type LapizReqJSON<R extends string = string> = {
	routeParams?: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	contentType: "application/json";
	body: Object;
}
export type LapizReqBLOB<R extends string = string> = {
	routeParams?: RouteParameters<R> extends Record<string, never> ? never : RouteParameters<R>;
	headers?: Record<string, string>;
	contentType: BinaryMimeType;
	body: BodyInit;
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
	contentType?: never;
	body?: never;
}
export type LapizResTEXT =
{
	status: number;
	headers?: Record<string, string>;
	contentType: "text/plain";
	body: string;
}
export type LapizResJSON =
{
	status: number;
	headers?: Record<string, string>;
	contentType: "application/json";
	body: Object;
}
export type LapizResBLOB =
{
	status: number;
	headers?: Record<string, string>;
	contentType: BinaryMimeType;
	body: ReadableStream;
}
export type LapizRes = LapizResVOID|LapizResTEXT|LapizResJSON|LapizResBLOB;
