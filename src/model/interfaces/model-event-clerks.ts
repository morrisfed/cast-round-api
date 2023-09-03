import * as t from "io-ts";

import { ModelEvent } from "./model-events";
import { ModelLinkUserDetails } from "./model-users";

export const ModelEventClerk = t.strict({
  eventId: t.number,
  clerkUserId: t.string,
});
export type ModelEventClerk = t.TypeOf<typeof ModelEventClerk>;

export const ModelEventClerkWithEventAndUserDetails = t.strict({
  eventId: t.number,
  clerkUserId: t.string,

  event: ModelEvent,
  clerkUser: ModelLinkUserDetails,
});
export type ModelEventClerkWithEventAndUserDetails = t.TypeOf<
  typeof ModelEventClerkWithEventAndUserDetails
>;

export type ModelBuildableEventClerk = ModelEventClerk;
