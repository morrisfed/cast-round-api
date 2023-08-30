import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as ROA from "fp-ts/lib/ReadonlyArray";
import * as RONEA from "fp-ts/lib/ReadonlyNonEmptyArray";
import * as ORD from "fp-ts/Ord";
import * as EQ from "fp-ts/Eq";
import * as STR from "fp-ts/string";
import * as BOOL from "fp-ts/boolean";
import * as SEMI from "fp-ts/Semigroup";

import { Transaction } from "sequelize";

import { LoggedInUser, User } from "../interfaces/users";
import {
  ModelBuildableMotionVote,
  ModelMotionSubTotal,
  ModelMotionVote,
} from "../model/interfaces/model-motion-votes";
import transactionalTaskEither from "../model/transaction";
import { findMotionById } from "../model/motions";
import { ModelMotion } from "../model/interfaces/model-motions";
import {
  createMotionVote,
  deleteMotionVotesForOnBehalfUser,
  findAllMotionVotes,
  findAllMotionsVotesForOnBehalfUser,
} from "../model/motion-votes";
import { findEventGroupDelegateByLinkAndEvent } from "../model/event-group-delegates";
import { findEventTellorByEventAndTellorUser } from "../model/event-tellors";
import {
  hasVoteTotalsReadAllPermission,
  hasVoteTotalsReadOwnEventPermission,
} from "../user/permissions";

export interface Vote {
  code: string;
  count: number;
  advanced: boolean;
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
      advanced: vote.advanced,
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

const ordVoteByResponseCode: ORD.Ord<Vote> = pipe(
  STR.Ord,
  ORD.contramap((vote: Vote) => vote.code)
);
const ordVoteByAdvanced: ORD.Ord<Vote> = pipe(
  BOOL.Ord,
  ORD.contramap((vote: Vote) => vote.advanced)
);
const ordVoteByResponseCodeAndAdvanced = ORD.getMonoid<Vote>().concat(
  ordVoteByResponseCode,
  ordVoteByAdvanced
);

const eqVoteByResponseCode: EQ.Eq<Vote> = pipe(
  STR.Eq,
  EQ.contramap((vote: Vote) => vote.code)
);
const eqVoteByAdvanced: EQ.Eq<Vote> = pipe(
  BOOL.Eq,
  EQ.contramap((vote: Vote) => vote.advanced)
);
const eqVoteByResponseCodeAndAdvanced = EQ.getMonoid<Vote>().concat(
  eqVoteByResponseCode,
  eqVoteByAdvanced
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

const deduplicateVoteResponses = (votes: readonly Vote[]) =>
  pipe(
    votes,
    ROA.sort(ordVoteByResponseCodeAndAdvanced),
    group(eqVoteByResponseCodeAndAdvanced),
    ROA.map(mergeVotes)
  );

const ordSubtotalByResponseCode: ORD.Ord<ModelMotionSubTotal> = pipe(
  STR.Ord,
  ORD.contramap((vote: ModelMotionSubTotal) => vote.responseCode)
);
const ordSubtotalByAdvanced: ORD.Ord<ModelMotionSubTotal> = pipe(
  BOOL.Ord,
  ORD.contramap((vote: ModelMotionSubTotal) => vote.advanced)
);
const ordSubtotalByResponseCodeAndAdvanced =
  ORD.getMonoid<ModelMotionSubTotal>().concat(
    ordSubtotalByResponseCode,
    ordSubtotalByAdvanced
  );

const eqSubtotalByResponseCode: EQ.Eq<ModelMotionSubTotal> = pipe(
  STR.Eq,
  EQ.contramap((vote: ModelMotionSubTotal) => vote.responseCode)
);
const eqSubtotalByAdvanced: EQ.Eq<ModelMotionSubTotal> = pipe(
  BOOL.Eq,
  EQ.contramap((vote: ModelMotionSubTotal) => vote.advanced)
);
const eqSubtotalByResponseCodeAndAdvanced =
  EQ.getMonoid<ModelMotionSubTotal>().concat(
    eqSubtotalByResponseCode,
    eqSubtotalByAdvanced
  );

const modelMotionVoteToSubtotal = (
  vote: ModelMotionVote
): ModelMotionSubTotal => ({
  responseCode: vote.responseCode,
  subtotal: vote.votes,
  advanced: vote.advanced,
});
const modelMotionVoteArrayToSubtotalArray = (
  votes: readonly ModelMotionVote[]
): readonly ModelMotionSubTotal[] => ROA.map(modelMotionVoteToSubtotal)(votes);

const mergeSubtotalPair: SEMI.Semigroup<ModelMotionSubTotal> = {
  concat: (x, y) => ({ ...x, subtotal: x.subtotal + y.subtotal }),
};

const mergeSubtotals = (
  votes: RONEA.ReadonlyNonEmptyArray<ModelMotionSubTotal>
) => SEMI.concatAll(mergeSubtotalPair)(RONEA.head(votes))(RONEA.tail(votes));

const subtotalModelMotionVotes = (
  votes: readonly ModelMotionVote[]
): readonly ModelMotionSubTotal[] =>
  pipe(
    votes,
    modelMotionVoteArrayToSubtotalArray,
    ROA.sort(ordSubtotalByResponseCodeAndAdvanced),
    group(eqSubtotalByResponseCodeAndAdvanced),
    ROA.map(mergeSubtotals)
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

const motionCanAcceptVotes = (motion: ModelMotion) =>
  motion.status === "open" || motion.status === "advanced";

const conflictIfMotionCannotAcceptVotes = (
  motion: ModelMotion
): E.Either<"conflict", void> =>
  motionCanAcceptVotes(motion)
    ? E.right(undefined)
    : E.left("conflict" as const);

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

const userCanReadTotalsForMotion =
  (user: LoggedInUser) =>
  (motion: ModelMotion): boolean => {
    if (hasVoteTotalsReadAllPermission(user)) {
      return true;
    }

    if (hasVoteTotalsReadOwnEventPermission(user)) {
      if (user.source === "link") {
        if (
          user.link.type === "group-delegate" &&
          user.link.info.delegateForEventId === motion.eventId
        ) {
          return true;
        }
        if (
          user.link.type === "tellor" &&
          user.link.info.tellorForEventId === motion.eventId
        ) {
          return true;
        }
      }
    }

    return false;
  };

const forbiddenErrorIfUserCannotReadVotesTotals =
  (user: LoggedInUser) =>
  (motion: ModelMotion): E.Either<Error | "forbidden", void> =>
    userCanReadTotalsForMotion(user)(motion)
      ? E.right(undefined)
      : E.left("forbidden" as const);

const getAllMotionVotes =
  (user: LoggedInUser) =>
  (
    motionId: number
  ): TE.TaskEither<
    Error | "not-found" | "forbidden",
    readonly ModelMotionVote[]
  > =>
    transactionalTaskEither((t) =>
      pipe(
        findMotionById(t)(motionId),
        TE.chainFirstEitherKW(forbiddenErrorIfUserCannotReadVotesTotals(user)),
        TE.chainW(() => findAllMotionVotes(t)(motionId))
      )
    );

export const getMotionVoteTotals =
  (user: LoggedInUser) =>
  (
    motionId: number
  ): TE.TaskEither<
    Error | "not-found" | "forbidden",
    readonly ModelMotionSubTotal[]
  > =>
    pipe(getAllMotionVotes(user)(motionId), TE.map(subtotalModelMotionVotes));

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

const assignAdvancedFlag =
  (advanced: boolean) =>
  (voteWithoutAdvancedFlag: Omit<Vote, "advanced">): Vote => ({
    ...voteWithoutAdvancedFlag,
    advanced,
  });

const assignAdvancedFlags =
  (advanced: boolean) =>
  (
    votesWithoutAdvancedFlag: readonly Omit<Vote, "advanced">[]
  ): readonly Vote[] =>
    ROA.map(assignAdvancedFlag(advanced))(votesWithoutAdvancedFlag);

export const submitMotionVotes = (
  user: LoggedInUser,
  motionId: number,
  onBehalfOfUserId: string,
  votes: readonly Omit<Vote, "advanced">[]
): TE.TaskEither<
  Error | "not-found" | "forbidden" | "conflict",
  readonly ModelMotionVote[]
> =>
  transactionalTaskEither((t) =>
    pipe(
      findMotionById(t)(motionId),
      TE.chainFirstW(
        forbiddenErrorIfUserCannotSubmitForMember(t)(user)(onBehalfOfUserId)
      ),
      TE.chainFirstEitherKW(conflictIfMotionCannotAcceptVotes),
      TE.chainFirstW(clearPreviousVotes(t)(onBehalfOfUserId)),
      TE.map((motion) =>
        votesToBuildableMotionVotes(user)(onBehalfOfUserId)(
          deduplicateVoteResponses(
            assignAdvancedFlags(motion.status === "advanced")(votes)
          )
        )(motion)
      ),
      TE.chainW(createMotionVotes(t))
    )
  );
