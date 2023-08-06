import * as t from "io-ts";

const ModelMotionStatus = t.union([
  t.literal("draft"),
  t.literal("proxy"),
  t.literal("open"),
  t.literal("closed"),
  t.literal("cancelled"),
  t.literal("discarded"),
]);
export type ModelMotionStatus = t.TypeOf<typeof ModelMotionStatus>;

export const ModelMotion = t.strict({
  id: t.number,
  eventId: t.number,
  status: ModelMotionStatus,
  title: t.string,
  description: t.string,
});
export type ModelMotion = t.TypeOf<typeof ModelMotion>;

export interface ModelBuildableMotion extends Omit<ModelMotion, "id"> {}

export interface ModelMotionUpdates
  extends Partial<Omit<ModelBuildableMotion, "eventId">> {}
