import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedEventTellor } from "../db/event-tellors";

export const findPersistedEventTellors =
  (include: FindOptions["include"]) => (t: Transaction) => (eventId: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventTellor.findAll({
            where: {
              eventId,
            },
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      )
    );
