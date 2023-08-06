import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types";

import { ModelMotion } from "./model-motions";

export const ModelEvent = t.strict({
  id: t.number,
  name: t.string,
  description: t.string,
  fromDate: DateFromISOString,
  toDate: DateFromISOString,
});
export type ModelEvent = t.TypeOf<typeof ModelEvent>;

export const ModelEventWithMotions = t.strict({
  id: t.number,
  name: t.string,
  description: t.string,
  fromDate: DateFromISOString,
  toDate: DateFromISOString,
  motions: t.array(ModelMotion),
});
export type ModelEventWithMotions = t.TypeOf<typeof ModelEventWithMotions>;

export interface ModelBuildableEvent extends Omit<ModelEvent, "id"> {}

export interface ModelEventUpdates extends Partial<ModelBuildableEvent> {}
