import * as t from "io-ts";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";

export const ModelMotionVote = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.number,
    motionId: t.number,
    onBehalfOfUserId: t.string,
    submittedByUserId: t.string,
    responseCode: t.string,
    votes: t.number,
    advanced: t.boolean,
  })
);

export type ModelMotionVote = t.TypeOf<typeof ModelMotionVote>;

export const ModelBuildableMotionVote = t.strict({
  motionId: t.number,
  onBehalfOfUserId: t.string,
  submittedByUserId: t.string,
  responseCode: t.string,
  votes: t.number,
  advanced: t.boolean,
});
export type ModelBuildableMotionVote = t.TypeOf<
  typeof ModelBuildableMotionVote
>;

export const ModelMotionSubTotal = t.strict({
  responseCode: t.string,
  subtotal: t.number,
  advanced: t.boolean,
});

export type ModelMotionSubTotal = t.TypeOf<typeof ModelMotionSubTotal>;
