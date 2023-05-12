import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { BuildableEvent, Event } from "../interfaces/events";
import { PersistedEvent } from "./db/events";

export const findAllEvents = (t: Transaction): TE.TaskEither<Error, Event[]> =>
  TE.tryCatch(
    () => PersistedEvent.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

const findPersistedEvent =
  (include: FindOptions["include"]) => (t: Transaction) => (id: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEvent.findByPk(id, {
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const findEventById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", Event> =>
    findPersistedEvent([])(t)(id);

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
