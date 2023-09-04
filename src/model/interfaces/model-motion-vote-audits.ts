import * as t from "io-ts";
import * as tt from "io-ts-types";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";

const replacedVoteId = t.number;
const replacedVoteIds = t.array(replacedVoteId);
const replacedVoteIdsFromString = t.string.pipe(
  tt.JsonFromString.pipe(replacedVoteIds)
);

export const ModelMotionVoteAudit = DataValuesFromFromModel.pipe(
  t.strict({
    voteId: t.number,
    submissionId: tt.UUID,

    motionId: t.number,
    responseCode: t.string,
    votes: t.number,
    advancedVote: t.boolean,

    accountUserId: t.string,
    accountUserName: t.string,
    accountUserContact: t.string,
    accountUserType: t.string,

    submittedByUserId: t.string,
    submittedByUserType: t.string,
    submittedByUserName: t.string,

    submittedAt: tt.date,

    replacedPreviousVotes: replacedVoteIdsFromString,
    superseded: t.boolean,
  })
);

export type ModelMotionVoteAudit = t.TypeOf<typeof ModelMotionVoteAudit>;

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
