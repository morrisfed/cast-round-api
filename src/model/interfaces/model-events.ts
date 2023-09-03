import * as t from "io-ts";
import * as tt from "io-ts-types";

import { ModelMotion } from "./model-motions";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";

export const ModelEvent = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.number,
    name: t.string,
    description: t.string,
    fromDate: tt.date,
    toDate: tt.date,
  })
);
export type ModelEvent = t.TypeOf<typeof ModelEvent>;

export const ModelEventWithMotions = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.number,
    name: t.string,
    description: t.string,
    fromDate: tt.date,
    toDate: tt.date,
    motions: t.array(ModelMotion),
  })
);
export type ModelEventWithMotions = t.TypeOf<typeof ModelEventWithMotions>;

export interface ModelBuildableEvent extends Omit<ModelEvent, "id"> {}

export interface ModelEventUpdates extends Partial<ModelBuildableEvent> {}
