import * as t from "io-ts";
import { ModelMotionVote } from "../../model/interfaces/model-motion-votes";

const MotionVoteRequest = t.strict({
  code: t.string,
  count: t.number,
});

const MotionVoteSubtotal = t.strict({
  responseCode: t.string,
  subtotal: t.number,
  proxy: t.boolean,
});

export const GetMotionVoteTotalsResponse = t.strict({
  subtotals: t.readonlyArray(MotionVoteSubtotal),
});

export type GetMotionVoteTotalsResponse = t.TypeOf<
  typeof GetMotionVoteTotalsResponse
>;

export const GetMotionVotesResponse = t.strict({
  votes: t.readonlyArray(ModelMotionVote),
});

export type GetMotionVotesResponse = t.TypeOf<typeof GetMotionVotesResponse>;

export const SubmitMotionVotesRequest = t.strict({
  votes: t.array(MotionVoteRequest),
});

export type SubmitMotionVotesRequest = t.TypeOf<
  typeof SubmitMotionVotesRequest
>;

export const SubmitMotionVotesResponse = t.strict({
  votes: t.readonlyArray(ModelMotionVote),
});

export type SubmitMotionVotesResponse = t.TypeOf<
  typeof SubmitMotionVotesResponse
>;
