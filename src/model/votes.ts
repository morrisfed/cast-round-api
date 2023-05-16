import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { findPersistedEvent } from "./_internal/event";
import { BuildableVote, Vote, VoteUpdates } from "../interfaces/votes";
import { PersistedVote } from "./db/votes";
import { findPersistedVote, savePersistedVote } from "./_internal/vote";

export const findAllEventVotes =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error | "not-found", Vote[]> =>
    pipe(
      findPersistedEvent(["votes"])(t)(eventId),
      TE.map((event) => event.votes || [])
    );

export const findVoteById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", Vote> =>
    findPersistedVote([])(t)(id);

export const createEventVote =
  (t: Transaction) =>
  (buildableVote: BuildableVote): TE.TaskEither<Error, Vote> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedVote.create(
            {
              eventId: buildableVote.eventId,
              description: buildableVote.description,
              title: buildableVote.title,
              status: buildableVote.status,
            },
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      )
    );

const applyUpdatesToVote =
  (updates: VoteUpdates) =>
  (vote: PersistedVote): PersistedVote =>
    vote.set(updates);

export const updateEventVote =
  (t: Transaction) =>
  (eventId: number, voteId: number) =>
  (updates: VoteUpdates): TE.TaskEither<Error | "not-found", Vote> =>
    pipe(
      findPersistedVote([])(t)(voteId),
      TE.chainW(
        TE.fromPredicate(
          (vote) => vote.eventId === eventId,
          () => new Error("not-found")
        )
      ),
      TE.map(applyUpdatesToVote(updates)),
      TE.chainW(savePersistedVote(t))
    );
