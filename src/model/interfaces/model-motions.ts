import * as t from "io-ts";
import { JsonFromString, withFallback } from "io-ts-types";

import { ModelRole } from "./model-roles";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";

const ModelMotionStatus = t.union([
  t.literal("draft"),
  t.literal("advanced"),
  t.literal("hold"),
  t.literal("open"),
  t.literal("closed"),
  t.literal("cancelled"),
  t.literal("discarded"),
]);
export type ModelMotionStatus = t.TypeOf<typeof ModelMotionStatus>;

const ModelRoleVotesDefinition = t.strict({
  role: ModelRole,
  votes: t.number,
});

const ModelResponseDefinition = t.strict({
  sequence: t.number,
  code: t.string,
  label: t.string,
});

const ModelVoteDefinitionSchema1 = t.strict({
  definitionSchemaVersion: t.literal(1),
  roleVotes: t.array(ModelRoleVotesDefinition),
  responses: t.array(ModelResponseDefinition),
});
type ModelVoteDefinitionSchema1 = t.TypeOf<typeof ModelVoteDefinitionSchema1>;

const defaultVoteDefinitionSchema: ModelVoteDefinitionSchema1 = {
  definitionSchemaVersion: 1,
  roleVotes: [],
  responses: [],
};

const ModelVoteDefinition = ModelVoteDefinitionSchema1;

const ModelVoteDefinitionFromString = t.string.pipe(
  JsonFromString.pipe(ModelVoteDefinition)
);

export const ModelMotion = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.number,
    eventId: t.number,
    status: ModelMotionStatus,
    title: t.string,
    description: t.string,
    voteDefinition: withFallback(
      ModelVoteDefinitionFromString,
      defaultVoteDefinitionSchema
    ),
  })
);

export type ModelMotion = t.TypeOf<typeof ModelMotion>;

export const ModelBuildableMotion = t.strict({
  eventId: t.number,
  status: ModelMotionStatus,
  title: t.string,
  description: t.string,
  voteDefinition: ModelVoteDefinitionFromString,
});
export type ModelBuildableMotion = t.TypeOf<typeof ModelBuildableMotion>;

export const ModelMotionUpdates = t.exact(
  t.partial({
    status: ModelMotionStatus,
    title: t.string,
    description: t.string,
    voteDefinition: ModelVoteDefinitionFromString,
  })
);
export type ModelMotionUpdates = t.TypeOf<typeof ModelMotionUpdates>;
