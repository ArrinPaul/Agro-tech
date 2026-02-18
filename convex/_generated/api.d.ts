/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as users from "../users.js";
import type * as organizations from "../organizations.js";
import type * as warehouses from "../warehouses.js";
import type * as crops from "../crops.js";
import type * as resources from "../resources.js";
import type * as allocations from "../allocations.js";
import type * as auditLogs from "../auditLogs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  users: typeof users;
  organizations: typeof organizations;
  warehouses: typeof warehouses;
  crops: typeof crops;
  resources: typeof resources;
  allocations: typeof allocations;
  auditLogs: typeof auditLogs;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
