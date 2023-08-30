import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";

import { PersistedEventGroupDelegate } from "./db/event-group-delegates";
import {
  findPersistedEventGroupDelegatesByDelegateFor,
  findPersistedEventGroupDelegatesByDelegateId,
} from "./_internal/event-group-delegate";
import {
  ModelBuildableEventGroupDelegate,
  ModelEventGroupDelegateWithDelegateUserDelgateFor,
  ModelEventGroupDelegate,
} from "./interfaces/model-event-group-delegates";
import { decodePersistedIOE } from "./_internal/utils";

const asModelEventGroupDelegateWithDelegateUserDelgateFor = (
  persistedEventGroupDelgate: PersistedEventGroupDelegate
): IOE.IOEither<Error, ModelEventGroupDelegateWithDelegateUserDelgateFor> =>
  decodePersistedIOE<
    PersistedEventGroupDelegate,
    ModelEventGroupDelegateWithDelegateUserDelgateFor,
    Error
  >(ModelEventGroupDelegateWithDelegateUserDelgateFor)(
    () => new Error("Invalid event group delegate read from database")
  )(persistedEventGroupDelgate);

const asModelEventGroupDelegate = (
  persistedEventGroupDelgate: PersistedEventGroupDelegate
): IOE.IOEither<Error, ModelEventGroupDelegate> =>
  decodePersistedIOE<
    PersistedEventGroupDelegate,
    ModelEventGroupDelegate,
    Error
  >(ModelEventGroupDelegate)(
    () => new Error("Invalid event group delegate read from database")
  )(persistedEventGroupDelgate);

export const findEventGroupDelegateByAccountAndEvent =
  (t: Transaction) =>
  (eventId: number) =>
  (
    accountId: string
  ): TE.TaskEither<
    Error | "not-found",
    ModelEventGroupDelegateWithDelegateUserDelgateFor
  > =>
    pipe(
      findPersistedEventGroupDelegatesByDelegateFor([
        "delegateFor",
        "delegateUser",
      ])(t)(eventId)(accountId),
      TE.chainOptionKW(() => "not-found" as const)(A.head),
      TE.chainIOEitherKW(asModelEventGroupDelegateWithDelegateUserDelgateFor)
    );

export const findEventGroupDelegateByLinkAndEvent =
  (t: Transaction) =>
  (eventId: number) =>
  (
    linkId: string
  ): TE.TaskEither<
    Error | "not-found",
    ModelEventGroupDelegateWithDelegateUserDelgateFor
  > =>
    pipe(
      findPersistedEventGroupDelegatesByDelegateId([
        "delegateFor",
        "delegateUser",
      ])(t)(eventId)(linkId),
      TE.chainOptionKW(() => "not-found" as const)(A.head),
      TE.chainIOEitherKW(asModelEventGroupDelegateWithDelegateUserDelgateFor)
    );

const createPersistedEventGroupDelegate =
  (t: Transaction) =>
  (buildableEventGroupDelegate: ModelBuildableEventGroupDelegate) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventGroupDelegate.create(
            {
              eventId: buildableEventGroupDelegate.eventId,
              delegateUserId: buildableEventGroupDelegate.delegateUserId,
              delegateForUserId: buildableEventGroupDelegate.delegateForUserId,
            },
            { transaction: t }
          ),
        (reason) => new Error(String(reason))
      )
    );

export const createEventGroupDelegate =
  (t: Transaction) =>
  (
    buildableEventGroupDelegate: ModelBuildableEventGroupDelegate
  ): TE.TaskEither<Error, ModelEventGroupDelegate> =>
    pipe(
      createPersistedEventGroupDelegate(t)(buildableEventGroupDelegate),
      TE.chainIOEitherKW(asModelEventGroupDelegate)
    );

export const deleteEventGroupDelegate =
  (t: Transaction) => (eventId: number) => (delegateForUserId: string) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventGroupDelegate.destroy({
            where: { eventId, delegateForUserId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      )
    );
