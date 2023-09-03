import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";

import { decodePersistedIOE } from "./_internal/utils";
import { PersistedEventClerk } from "./db/event-clerks";
import {
  ModelBuildableEventClerk,
  ModelEventClerk,
  ModelEventClerkWithEventAndUserDetails,
} from "./interfaces/model-event-clerks";
import {
  createPersistedEventClerkWithIncludableReturn,
  findPersistedEventClerkByEventAndUser,
  findPersistedEventClerks,
} from "./_internal/event-clerks";

const dbEventClerkAsModelEventClerk = (
  dbEventClerk: PersistedEventClerk
): IOE.IOEither<Error, ModelEventClerk> =>
  decodePersistedIOE<PersistedEventClerk, ModelEventClerk, Error>(
    ModelEventClerk
  )(() => new Error("Invalid event clerk read from database"))(dbEventClerk);

const dbEventClerkAsModelEventClerkExpanded = (
  dbEventClerk: PersistedEventClerk
): IOE.IOEither<Error, ModelEventClerkWithEventAndUserDetails> =>
  decodePersistedIOE<
    PersistedEventClerk,
    ModelEventClerkWithEventAndUserDetails,
    Error
  >(ModelEventClerkWithEventAndUserDetails)(
    () => new Error("Invalid event clerk read from database")
  )(dbEventClerk);

const dbEventClerkArrayAsModelEventClerkExpandedArray = (
  dbEventClerks: PersistedEventClerk[]
): IOE.IOEither<Error, ModelEventClerkWithEventAndUserDetails[]> =>
  A.traverse(IOE.ApplicativePar)(dbEventClerkAsModelEventClerkExpanded)(
    dbEventClerks
  );

export const findEventClerksByEvent =
  (t: Transaction) =>
  (
    eventId: number
  ): TE.TaskEither<Error, ModelEventClerkWithEventAndUserDetails[]> =>
    pipe(
      findPersistedEventClerks(["clerkUser", "event"])(t)(eventId),
      TE.chainIOEitherKW(dbEventClerkArrayAsModelEventClerkExpandedArray)
    );

export const findEventClerkByEventAndClerkUser =
  (t: Transaction) =>
  (eventId: number) =>
  (
    linkUserId: string
  ): TE.TaskEither<
    Error | "not-found",
    ModelEventClerkWithEventAndUserDetails
  > =>
    pipe(
      findPersistedEventClerkByEventAndUser(["clerkUser", "event"])(t)(eventId)(
        linkUserId
      ),
      TE.chainW((p) => (p ? TE.right(p) : TE.left("not-found" as const))),
      TE.chainIOEitherKW(dbEventClerkAsModelEventClerkExpanded)
    );

export const createEventClerk =
  (t: Transaction) =>
  (
    buildableEventClerk: ModelBuildableEventClerk
  ): TE.TaskEither<Error, ModelEventClerk> =>
    pipe(
      createPersistedEventClerkWithIncludableReturn(t)([])(buildableEventClerk),
      TE.chainIOEitherK(dbEventClerkAsModelEventClerk)
    );

export const createEventClerkAndReturnExpanded =
  (t: Transaction) =>
  (
    buildableEventClerk: ModelBuildableEventClerk
  ): TE.TaskEither<Error, ModelEventClerkWithEventAndUserDetails> =>
    pipe(
      createPersistedEventClerkWithIncludableReturn(t)(["clerkUser", "event"])(
        buildableEventClerk
      ),
      TE.chainIOEitherK(dbEventClerkAsModelEventClerkExpanded)
    );

export const deleteEventClerk =
  (t: Transaction) =>
  (eventId: number, clerkUserId: string): TE.TaskEither<Error, number> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventClerk.destroy({
            where: { eventId, clerkUserId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      )
    );
