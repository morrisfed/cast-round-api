import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedVote } from "../db/votes";

export const findPersistedVote =
  (include: FindOptions["include"]) => (t: Transaction) => (id: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedVote.findByPk(id, {
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const savePersistedVote =
  <T extends PersistedVote>(t: Transaction) =>
  (vote: T) =>
    TE.tryCatch(
      () => vote.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );
