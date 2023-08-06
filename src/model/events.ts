import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Op, Transaction } from "sequelize";

import { PersistedEvent } from "./db/events";
import { findPersistedEvent } from "./_internal/event";
import { PersistedMotion } from "./db/motions";
import {
  ModelBuildableEvent,
  ModelEvent,
  ModelEventUpdates,
  ModelEventWithMotions,
} from "./interfaces/model-events";
import { DbEvent } from "./db/interfaces/db-events";
import { decodePersistedIOE } from "./_internal/utils";

interface PersistedEventWithMotions extends PersistedEvent {
  motions: PersistedMotion[];
}

const dbEventAsModelEvent = (
  dbEvent: DbEvent
): IOE.IOEither<Error, ModelEvent> =>
  decodePersistedIOE<DbEvent, ModelEvent, Error>(ModelEvent)(
    () => new Error("Invalid event read from database")
  )(dbEvent);

const dbEventAsModelEventWithMotions = (
  dbEvent: DbEvent
): IOE.IOEither<Error, ModelEventWithMotions> =>
  decodePersistedIOE<DbEvent, ModelEventWithMotions, Error>(
    ModelEventWithMotions
  )(() => new Error("Invalid event read from database"))(dbEvent);

const dbEventArrayAsModelEventArray = (
  dbEvents: DbEvent[]
): IOE.IOEither<Error, ModelEvent[]> =>
  A.traverse(IOE.ApplicativePar)(dbEventAsModelEvent)(dbEvents);

const isEventWithMotions: Refinement<
  PersistedEvent,
  PersistedEventWithMotions
> = (pewv): pewv is PersistedEventWithMotions => pewv.motions !== undefined;

const isCurrentEvent = (currentDate: Date) => (pe: PersistedEvent) =>
  pe.fromDate <= currentDate && pe.toDate >= currentDate;

export const findAllEvents = (
  t: Transaction
): TE.TaskEither<Error, ModelEvent[]> =>
  pipe(
    TE.tryCatch(
      () => PersistedEvent.findAll({ transaction: t }),
      (reason) => new Error(String(reason))
    ),
    TE.chainIOEitherKW(dbEventArrayAsModelEventArray)
  );

export const findEventsByDate = (t: Transaction) => (date: Date) =>
  pipe(
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
    ),
    TE.chainIOEitherKW(dbEventArrayAsModelEventArray)
  );

export const findEventWithMotionsById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", ModelEventWithMotions> =>
    pipe(
      findPersistedEvent(["motions"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isEventWithMotions,
          () => new Error(`Data error: event ${id} has no motions`)
        )
      ),
      TE.chainIOEitherKW(dbEventAsModelEventWithMotions)
    );

export const findCurrentEventWithMotionsById =
  (t: Transaction) =>
  (id: number) =>
  (date: Date): TE.TaskEither<Error | "not-found", ModelEventWithMotions> =>
    pipe(
      findPersistedEvent(["motions"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isEventWithMotions,
          () => new Error(`Data error: event ${id} has no motions`)
        )
      ),
      TE.filterOrElseW(isCurrentEvent(date), () => "not-found" as const),
      TE.chainIOEitherKW(dbEventAsModelEventWithMotions)
    );

const savePersistedEvent =
  <T extends PersistedEvent>(t: Transaction) =>
  (event: T) =>
    TE.tryCatch(
      () => event.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

const createPersistedEvent =
  (t: Transaction) => (buildableEvent: ModelBuildableEvent) =>
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
  (
    buildableEvent: ModelBuildableEvent
  ): TE.TaskEither<Error, ModelEventWithMotions> =>
    pipe(
      createPersistedEvent(t)(buildableEvent),
      TE.chainIOEitherKW(dbEventAsModelEvent),
      TE.map((event) => ({
        ...event,
        motions: [],
      }))
    );

const applyUpdatesToEvent =
  (updates: ModelEventUpdates) =>
  (event: PersistedEvent): PersistedEvent =>
    event.set(updates);

export const updateEvent =
  (t: Transaction) =>
  (
    eventId: number,
    updates: ModelEventUpdates
  ): TE.TaskEither<Error | "not-found", ModelEvent> =>
    pipe(
      findPersistedEvent([])(t)(eventId),
      TE.map(applyUpdatesToEvent(updates)),
      TE.chainW(savePersistedEvent(t)),
      TE.chainIOEitherKW(dbEventAsModelEvent)
    );
