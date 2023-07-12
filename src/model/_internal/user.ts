import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedUser } from "../db/users";

export const findPersistedUser =
  (include: FindOptions["include"]) => (t: Transaction) => (id: string) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedUser.findByPk(id, {
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const savePersistedUser =
  <T extends PersistedUser>(t: Transaction) =>
  (userInfo: T) =>
    TE.tryCatch(
      () => userInfo.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

export const deletePersistedUser = (t: Transaction) => (id: string) =>
  TE.tryCatch(
    () => PersistedUser.destroy({ where: { id }, transaction: t }),
    (reason) => new Error(String(reason))
  );
