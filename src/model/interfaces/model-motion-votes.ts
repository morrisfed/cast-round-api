import * as t from "io-ts";

export const ModelMotionVote = t.strict({
  id: t.number,
  motionId: t.number,
  onBehalfOfUserId: t.string,
  submittedByUserId: t.string,
  responseCode: t.string,
  votes: t.number,
});

export type ModelMotionVote = t.TypeOf<typeof ModelMotionVote>;

export const ModelBuildableMotionVote = t.strict({
  motionId: t.number,
  onBehalfOfUserId: t.string,
  submittedByUserId: t.string,
  responseCode: t.string,
  votes: t.number,
});
export type ModelBuildableMotionVote = t.TypeOf<
  typeof ModelBuildableMotionVote
>;
