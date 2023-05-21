import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";

import { BuildableEvent, Event, EventWithVotes } from "../interfaces/events";
import { PersistedEvent } from "./db/events";
import { findPersistedEvent } from "./_internal/event";
import { PersistedVote } from "./db/votes";

interface PersistedEventWithVotes extends PersistedEvent {
  votes: PersistedVote[];
}

const isEventWithVotes: Refinement<PersistedEvent, PersistedEventWithVotes> = (
  pewv
): pewv is PersistedEventWithVotes => pewv.votes !== undefined;

export const findAllEvents = (t: Transaction): TE.TaskEither<Error, Event[]> =>
  TE.tryCatch(
    () => PersistedEvent.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

export const findEventWithVotesById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", EventWithVotes> =>
    pipe(
      findPersistedEvent(["votes"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isEventWithVotes,
          () => new Error(`Data error: event ${id} has no votes`)
        )
      )
    );

const savePersistedEvent =
  <T extends PersistedEvent>(t: Transaction) =>
  (event: T) =>
    TE.tryCatch(
      () => event.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

const createPersistedEvent =
  (t: Transaction) => (buildableEvent: BuildableEvent) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEvent.create(
            {
              name: buildableEvent.name,
              description: buildableEvent.description,
              fromDate: buildableEvent.fromDate,
              toDate: buildableEvent.toDate,
            },
            { transaction: t }
          ),
        (reason) => new Error(String(reason))
      )
    );

export const createEvent =
  (t: Transaction) =>
  (buildableEvent: BuildableEvent): TE.TaskEither<Error, Event> =>
    pipe(createPersistedEvent(t)(buildableEvent));

const applyUpdatesToEvent =
  (updates: Partial<Event>) =>
  (event: PersistedEvent): PersistedEvent =>
    event.set(updates);

export const updateEvent =
  (t: Transaction) =>
  (
    eventId: number,
    updates: Partial<Event>
  ): TE.TaskEither<Error | "not-found", Event> =>
    pipe(
      findPersistedEvent([])(t)(eventId),
      TE.map(applyUpdatesToEvent(updates)),
      TE.chainW(savePersistedEvent(t))
    );
