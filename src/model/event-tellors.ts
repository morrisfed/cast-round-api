import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";
import { Refinement } from "fp-ts/lib/Refinement";

import { Transaction } from "sequelize";

import { PersistedEventTellor } from "./db/event-tellors";
import {
  findPersistedEventTellorByEventAndUser,
  findPersistedEventTellors,
} from "./_internal/event-tellors";

import { PersistedEvent } from "./db/events";
import { PersistedLinkUserDetails } from "./db/users";
import {
  ModelBuildableEventTellor,
  ModelEventTellor,
  ModelEventTellorNoExpansion,
} from "./interfaces/model-event-tellors";
import { DbEventTellor } from "./db/interfaces/db-event-tellors";
import { decodePersistedIOE } from "./_internal/utils";

interface PersistedEventTellorWithEventAndUser extends PersistedEventTellor {
  event: PersistedEvent;
  tellorUser: PersistedLinkUserDetails;
}

const isPersistedEventTellorWithEventAndUser: Refinement<
  PersistedEventTellor,
  PersistedEventTellorWithEventAndUser
> = (pet): pet is PersistedEventTellorWithEventAndUser =>
  pet.event !== undefined && pet.tellorUser !== undefined;

const dbEventTellorAsModelEventTellor = (
  dbEventTellor: DbEventTellor
): IOE.IOEither<Error, ModelEventTellor> =>
  decodePersistedIOE<DbEventTellor, ModelEventTellor, Error>(ModelEventTellor)(
    () => new Error("Invalid event tellor read from database")
  )(dbEventTellor);

const dbEventTellorAsModelEventTellorNoExpansion = (
  dbEventTellor: DbEventTellor
): IOE.IOEither<Error, ModelEventTellorNoExpansion> =>
  decodePersistedIOE<DbEventTellor, ModelEventTellorNoExpansion, Error>(
    ModelEventTellorNoExpansion
  )(() => new Error("Invalid event tellor read from database"))(dbEventTellor);

const dbEventTellorArrayAsModelEventTellorArray = (
  dbEventTellors: DbEventTellor[]
): IOE.IOEither<Error, ModelEventTellor[]> =>
  A.traverse(IOE.ApplicativePar)(dbEventTellorAsModelEventTellor)(
    dbEventTellors
  );

export const findEventTellorsByEvent =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error, ModelEventTellor[]> =>
    pipe(
      findPersistedEventTellors(["tellorUser", "event"])(t)(eventId),
      TE.map(A.filter(isPersistedEventTellorWithEventAndUser)),
      TE.chainIOEitherKW(dbEventTellorArrayAsModelEventTellorArray)
    );

export const findEventTellorByEventAndTellorUser =
  (t: Transaction) =>
  (eventId: number) =>
  (linkUserId: string): TE.TaskEither<Error | "not-found", ModelEventTellor> =>
    pipe(
      findPersistedEventTellorByEventAndUser(["tellorUser", "event"])(t)(
        eventId
      )(linkUserId),
      TE.chainW((p) => (p ? TE.right(p) : TE.left("not-found" as const))),
      TE.chainIOEitherKW(dbEventTellorAsModelEventTellor)
    );

const createPersistedEventTellor =
  (t: Transaction) => (buildableEventTellor: ModelBuildableEventTellor) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventTellor.create(
            {
              eventId: buildableEventTellor.eventId,
              tellorUserId: buildableEventTellor.tellorUserId,
            },
            { transaction: t, include: ["event", "tellorUser"] }
          ),
        (reason) => new Error(String(reason))
      )
    );

const reloadPersistedEventTellor =
  (t: Transaction) => (persistedEventTellor: PersistedEventTellor) =>
    pipe(
      TE.tryCatch(
        () =>
          persistedEventTellor.reload({
            transaction: t,
            include: ["event", "tellorUser"],
          }),
        (reason) => new Error(String(reason))
      )
    );

export const createEventTellor =
  (t: Transaction) =>
  (
    buildableEventTellor: ModelBuildableEventTellor
  ): TE.TaskEither<Error, ModelEventTellorNoExpansion> =>
    pipe(
      createPersistedEventTellor(t)(buildableEventTellor),
      TE.chainW(reloadPersistedEventTellor(t)),
      TE.chainIOEitherK(dbEventTellorAsModelEventTellorNoExpansion)
    );

export const deleteEventTellor =
  (t: Transaction) =>
  (eventId: number, tellorUserId: string): TE.TaskEither<Error, unknown> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventTellor.destroy({
            where: { eventId, tellorUserId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      )
    );
