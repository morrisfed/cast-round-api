import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as RONEA from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as ORD from "fp-ts/Ord";
import * as EQ from "fp-ts/Eq";
import * as Str from "fp-ts/string";
import * as SEMI from "fp-ts/Semigroup";

import { Transaction } from "sequelize";

import { LoggedInUser, User } from "../interfaces/users";
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
import { findEventGroupDelegateByLinkAndEvent } from "../model/event-group-delegates";
import { findEventTellorByEventAndTellorUser } from "../model/event-tellors";

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
  (onBehalfOfUserId: string) =>
  (votes: readonly Vote[]) =>
  (motion: ModelMotion): ModelBuildableMotionVote[] =>
    votes.map((vote) => ({
      responseCode: vote.code,
      votes: vote.count,
      motionId: motion.id,
      onBehalfOfUserId,
      submittedByUserId: user.id,
    }));

const createMotionVotes =
  (t: Transaction) =>
  (
    motionVotes: ModelBuildableMotionVote[]
  ): TE.TaskEither<Error, readonly ModelMotionVote[]> =>
    ROA.traverse(TE.ApplicativePar)(createMotionVote(t))(motionVotes);

const clearPreviousVotes =
  (t: Transaction) => (onBehalfOfUserId: string) => (motion: ModelMotion) =>
    deleteMotionVotesForOnBehalfUser(t)(onBehalfOfUserId)(motion.id);

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

// Checks whether the given user has permission to submit the given votes
const userCanSubmitVotesForMember =
  (t: Transaction) =>
  (user: LoggedInUser) =>
  (memberId: string) =>
  (motion: ModelMotion): TE.TaskEither<Error, boolean> => {
    // If the current user is a member, they can only submit votes on their own behalf.
    if (user.source === "account") {
      return TE.right(user.id === memberId);
    }

    if (user.link.type === "group-delegate") {
      // If the current user is a group delegate, they can only submit votes for events they are linked to.
      return pipe(
        findEventGroupDelegateByLinkAndEvent(t)(motion.eventId)(user.id),
        TE.map(
          (eventGroupDelegate) =>
            eventGroupDelegate.delegateForUserId === memberId
        ),
        TE.orElse((e) => (e === "not-found" ? TE.right(false) : TE.left(e)))
      );
    }

    // If the current user is a tellor, they can only submit votes for events they are linked to, but they can submit votes on behalf of any member.
    return pipe(
      findEventTellorByEventAndTellorUser(t)(motion.eventId)(user.id),
      TE.map(() => true),
      TE.orElse((e) => (e === "not-found" ? TE.right(false) : TE.left(e)))
    );
  };

const userCanReadVotesForMember =
  (t: Transaction) =>
  (user: LoggedInUser) =>
  (memberId: string) =>
  (motion: ModelMotion): TE.TaskEither<Error, boolean> =>
    userCanSubmitVotesForMember(t)(user)(memberId)(motion);

// If the logged in user is not permitted to submit votes on behalf of the given member then return a "forbidden" error.
const forbiddenErrorIfUserCannotSubmitForMember =
  (t: Transaction) =>
  (user: LoggedInUser) =>
  (memberId: string) =>
  (motion: ModelMotion): TE.TaskEither<Error | "forbidden", void> =>
    pipe(
      userCanSubmitVotesForMember(t)(user)(memberId)(motion),
      TE.chainW((canSubmit) =>
        canSubmit ? TE.right(undefined) : TE.left("forbidden" as const)
      )
    );

const forbiddenErrorIfUserCannotReadVotesForMember =
  (t: Transaction) =>
  (user: LoggedInUser) =>
  (memberId: string) =>
  (motion: ModelMotion): TE.TaskEither<Error | "forbidden", void> =>
    pipe(
      userCanReadVotesForMember(t)(user)(memberId)(motion),
      TE.chainW((canSubmit) =>
        canSubmit ? TE.right(undefined) : TE.left("forbidden" as const)
      )
    );

export const getMemberMotionVotes =
  (user: LoggedInUser) =>
  (
    motionId: number,
    onBehalfOfUserId: string
  ): TE.TaskEither<
    Error | "not-found" | "forbidden",
    readonly ModelMotionVote[]
  > =>
    transactionalTaskEither((t) =>
      pipe(
        findMotionById(t)(motionId),
        TE.chainFirstW(
          forbiddenErrorIfUserCannotReadVotesForMember(t)(user)(
            onBehalfOfUserId
          )
        ),
        TE.chainW(() =>
          findAllMotionsVotesForOnBehalfUser(t)(onBehalfOfUserId)(motionId)
        )
      )
    );

export const submitMotionVotes = (
  user: LoggedInUser,
  motionId: number,
  onBehalfOfUserId: string,
  votes: Vote[]
): TE.TaskEither<
  Error | "not-found" | "forbidden",
  readonly ModelMotionVote[]
> =>
  transactionalTaskEither((t) =>
    pipe(
      findMotionById(t)(motionId),
      TE.chainFirstW(
        forbiddenErrorIfUserCannotSubmitForMember(t)(user)(onBehalfOfUserId)
      ),
      TE.chainFirstW(clearPreviousVotes(t)(onBehalfOfUserId)),
      TE.map(
        votesToBuildableMotionVotes(user)(onBehalfOfUserId)(
          deduplicateVoteResponses(votes)
        )
      ),
      TE.chainW(createMotionVotes(t))
    )
  );
