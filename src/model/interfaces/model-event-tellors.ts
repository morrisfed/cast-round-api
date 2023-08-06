import * as t from "io-ts";

import { ModelEvent } from "./model-events";
import { ModelLinkUserDetailsNoExpansion } from "./model-users";

export const ModelEventTellorNoExpansion = t.strict({
  eventId: t.number,
  tellorUserId: t.string,
});
export type ModelEventTellorNoExpansion = t.TypeOf<
  typeof ModelEventTellorNoExpansion
>;

export const ModelEventTellor = t.strict({
  eventId: t.number,
  tellorUserId: t.string,

  event: ModelEvent,
  tellorUser: ModelLinkUserDetailsNoExpansion,
});
export type ModelEventTellor = t.TypeOf<typeof ModelEventTellor>;

export interface ModelBuildableEventTellor
  extends Omit<ModelEventTellor, "event" | "tellorUser"> {}
