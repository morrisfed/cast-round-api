import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedEvent } from "../db/events";

export const findPersistedEvent =
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
