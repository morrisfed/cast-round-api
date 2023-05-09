import * as TE from "fp-ts/lib/TaskEither";
import { Transaction } from "sequelize";
import { PersistedDelegate } from "./db/UserInfo";

export const findAll = (
  t: Transaction
): TE.TaskEither<Error, PersistedDelegate[]> =>
  TE.tryCatch(
    () => PersistedDelegate.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );
