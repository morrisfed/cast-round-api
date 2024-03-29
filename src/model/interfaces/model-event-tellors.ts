import * as t from "io-ts";

import { ModelEvent } from "./model-events";
import { ModelLinkUserDetails } from "./model-users";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";

export const ModelEventTellorNoExpansion = DataValuesFromFromModel.pipe(
  t.strict({
    eventId: t.number,
    tellorUserId: t.string,
  })
);
export type ModelEventTellorNoExpansion = t.TypeOf<
  typeof ModelEventTellorNoExpansion
>;

export const ModelEventTellor = DataValuesFromFromModel.pipe(
  t.strict({
    eventId: t.number,
    tellorUserId: t.string,

    event: ModelEvent,
    tellorUser: ModelLinkUserDetails,
  })
);
export type ModelEventTellor = t.TypeOf<typeof ModelEventTellor>;

export interface ModelBuildableEventTellor
  extends Omit<ModelEventTellor, "event" | "tellorUser"> {}
