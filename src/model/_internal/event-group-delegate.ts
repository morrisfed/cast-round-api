import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedEventGroupDelegate } from "../db/event-group-delegates";

export const findPersistedEventGroupDelegates =
  (include: FindOptions["include"]) =>
  (t: Transaction) =>
  (eventId: number) =>
  (accountId: string) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventGroupDelegate.findAll({
            where: {
              eventId,
              delegateForUserId: accountId,
            },
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      )
    );
