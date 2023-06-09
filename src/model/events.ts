import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Op, Transaction } from "sequelize";

import { BuildableEvent, Event, EventWithMotions } from "../interfaces/events";
import { PersistedEvent } from "./db/events";
import { findPersistedEvent } from "./_internal/event";
import { PersistedMotion } from "./db/motions";

interface PersistedEventWithMotions extends PersistedEvent {
  motions: PersistedMotion[];
}

const isEventWithMotions: Refinement<
  PersistedEvent,
  PersistedEventWithMotions
> = (pewv): pewv is PersistedEventWithMotions => pewv.motions !== undefined;

const isCurrentEvent = (currentDate: Date) => (pe: PersistedEvent) =>
  pe.fromDate <= currentDate && pe.toDate >= currentDate;

export const findAllEvents = (t: Transaction): TE.TaskEither<Error, Event[]> =>
  TE.tryCatch(
    () => PersistedEvent.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

export const findEventsByDate = (t: Transaction) => (date: Date) =>
  TE.tryCatch(
    () =>
      PersistedEvent.findAll({
        where: {
          fromDate: {
            [Op.lte]: date,
          },
          toDate: {
            [Op.gte]: date,
          },
        },
        transaction: t,
      }),
    (reason) => new Error(String(reason))
  );

export const findEventWithMotionsById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", EventWithMotions> =>
    pipe(
      findPersistedEvent(["motions"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isEventWithMotions,
          () => new Error(`Data error: event ${id} has no motions`)
        )
      )
    );

export const findCurrentEventWithMotionsById =
  (t: Transaction) =>
  (id: number) =>
  (date: Date): TE.TaskEither<Error | "not-found", EventWithMotions> =>
    pipe(
      findPersistedEvent(["motions"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isEventWithMotions,
          () => new Error(`Data error: event ${id} has no motions`)
        )
      ),
      TE.filterOrElseW(isCurrentEvent(date), () => "not-found" as const)
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
  (buildableEvent: BuildableEvent): TE.TaskEither<Error, EventWithMotions> =>
    pipe(
      createPersistedEvent(t)(buildableEvent),
      TE.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        fromDate: event.fromDate,
        toDate: event.toDate,
        motions: [],
      }))
    );

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
