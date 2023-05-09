import * as TE from "fp-ts/lib/TaskEither";
import { Transaction } from "sequelize";
import { PersistedAccount } from "./db/UserInfo";

export const findAll = (
  t: Transaction
): TE.TaskEither<Error, PersistedAccount[]> =>
  TE.tryCatch(
    () => PersistedAccount.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );
