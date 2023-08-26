import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as RONEA from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as ORD from "fp-ts/Ord";
import * as EQ from "fp-ts/Eq";
import * as Str from "fp-ts/string";
import * as SEMI from "fp-ts/Semigroup";

import { Transaction } from "sequelize";

import { User } from "../interfaces/users";
import {
  ModelBuildableMotionVote,
  ModelMotionVote,
} from "../model/interfaces/model-motion-votes";
import transactionalTaskEither from "../model/transaction";
import { findMotionById } from "../model/motions";
import { ModelMotion } from "../model/interfaces/model-motions";
import {
  createMotionVote,
  deleteMotionVotesForOnBehalfUser,
  findAllMotionsVotesForOnBehalfUser,
} from "../model/motion-votes";

export interface Vote {
  code: string;
  count: number;
}

export interface VoteWithMotionId extends Vote {
  motionId: number;
}

export interface VoteWithUserIds extends VoteWithMotionId {
  onBehalfOfUserId: string;
  submittedByUserId: string;
}

const votesToBuildableMotionVotes =
  (user: User) =>
  (votes: readonly Vote[]) =>
  (motion: ModelMotion): ModelBuildableMotionVote[] =>
    votes.map((vote) => ({
      responseCode: vote.code,
      votes: vote.count,
      motionId: motion.id,
      onBehalfOfUserId: user.id,
      submittedByUserId: user.id,
    }));

const createMotionVotes =
  (t: Transaction) =>
  (
    motionVotes: ModelBuildableMotionVote[]
  ): TE.TaskEither<Error, readonly ModelMotionVote[]> =>
    ROA.traverse(TE.ApplicativePar)(createMotionVote(t))(motionVotes);

const clearPreviousVotes =
  (t: Transaction) => (user: User) => (motion: ModelMotion) =>
    deleteMotionVotesForOnBehalfUser(t)(user.id)(motion.id);

const ordResponseCode: ORD.Ord<string> = Str.Ord;

const ordVoteByResponseCode: ORD.Ord<Vote> = pipe(
  ordResponseCode,
  ORD.contramap((vote: Vote) => vote.code)
);

const eqResponseCode: EQ.Eq<string> = Str.Eq;

const eqVoteByResponseCode: EQ.Eq<Vote> = pipe(
  eqResponseCode,
  EQ.contramap((vote: Vote) => vote.code)
);

const group =
  <A>(S: EQ.Eq<A>) =>
  (as: ReadonlyArray<A>): ReadonlyArray<RONEA.ReadonlyNonEmptyArray<A>> =>
    RONEA.group(S)(as);

const mergeVotePair: SEMI.Semigroup<Vote> = {
  concat: (x, y) => ({ ...x, count: x.count + y.count }),
};

const mergeVotes = (votes: RONEA.ReadonlyNonEmptyArray<Vote>) =>
  SEMI.concatAll(mergeVotePair)(RONEA.head(votes))(RONEA.tail(votes));

const deduplicateVoteResponses = (votes: Vote[]) =>
  pipe(
    votes,
    ROA.sort(ordVoteByResponseCode),
    group(eqVoteByResponseCode),
    ROA.map(mergeVotes)
  );

export const getUserMotionVotes =
  (user: User) =>
  (
    motionId: number
  ): TE.TaskEither<Error | "not-found", readonly ModelMotionVote[]> =>
    transactionalTaskEither((t) =>
      findAllMotionsVotesForOnBehalfUser(t)(user.id)(motionId)
    );

export const userSubmitOwnVotes = (
  user: User,
  motionId: number,
  votes: Vote[]
): TE.TaskEither<
  Error | "not-found" | "forbidden",
  readonly ModelMotionVote[]
> =>
  transactionalTaskEither((t) =>
    pipe(
      findMotionById(t)(motionId),
      TE.chainFirstW(clearPreviousVotes(t)(user)),
      TE.map(
        votesToBuildableMotionVotes(user)(deduplicateVoteResponses(votes))
      ),
      TE.chainW(createMotionVotes(t))
    )
  );
