import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";

import {
  BuildableEventGroupDelegate,
  EventGroupDelegate,
} from "../interfaces/events";
import { PersistedEventGroupDelegate } from "./db/event-group-delegates";
import { findPersistedEventGroupDelegates } from "./_internal/event-group-delegate";

export const findEventGroupDelegateByAccountAndEvent =
  (t: Transaction) =>
  (eventId: number) =>
  (accountId: string): TE.TaskEither<Error | "not-found", EventGroupDelegate> =>
    pipe(
      findPersistedEventGroupDelegates(["delegateFor", "delegateUser"])(t)(
        eventId
      )(accountId),
      TE.chainOptionKW(() => "not-found" as const)(A.head)
    );

const createPersistedEventGroupDelegate =
  (t: Transaction) =>
  (buildableEventGroupDelegate: BuildableEventGroupDelegate) =>
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
    buildableEventGroupDelegate: BuildableEventGroupDelegate
  ): TE.TaskEither<Error, EventGroupDelegate> =>
    pipe(createPersistedEventGroupDelegate(t)(buildableEventGroupDelegate));
