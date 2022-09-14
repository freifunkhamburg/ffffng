/**
 * This module and all submodules provide types that are being shared between client and server.
 */
import { isString } from "./primitives";

export * from "./arrays";
export * from "./config";
export * from "./email";
export * from "./enums";
export * from "./helpers";
export * from "./json";
export * from "./maps";
export * from "./monitoring";
export * from "./newtypes";
export * from "./node";
export * from "./objects";
export * from "./primitives";
export * from "./regexps";
export * from "./statistics";
export * from "./sortfields";
export * from "./task";
export * from "./time";

export type SearchTerm = string & { readonly __tag: unique symbol };
export const isSearchTerm = isString;
