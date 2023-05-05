import * as TE from "fp-ts/lib/TaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { Monoid } from "fp-ts/lib/Monoid";
import { Transaction } from "sequelize";
import { UserInfo } from "../interfaces/UserInfo";
import { createUserInfo, updateUserInfo } from "../model/userInfo";
import transactionalTaskEither from "../model/transaction";

interface ImportResult {
  created: number;
  updated: number;
  error: number;
  errorMessage: string[];
}

const monoidImportResult: Monoid<ImportResult> = {
  concat: (x, y) => ({
    created: x.created + y.created,
    updated: x.updated + y.updated,
    error: x.error + y.error,
    errorMessage: x.errorMessage.concat(y.errorMessage),
  }),
  empty: { created: 0, updated: 0, error: 0, errorMessage: [] },
};

const processImportedUserAsUpdate =
  (t: Transaction) =>
  (importedUser: UserInfo): TE.TaskEither<Error | "not-found", ImportResult> =>
    pipe(
      updateUserInfo(t)(importedUser.id, importedUser),
      TE.map(() => ({ created: 0, updated: 1, error: 0, errorMessage: [] }))
    );

const processImportedUserAsCreate =
  (t: Transaction) =>
  (importedUser: UserInfo): TE.TaskEither<Error, ImportResult> =>
    pipe(
      TE.of(importedUser),
      TE.chain(createUserInfo(t)),
      TE.map(() => ({ created: 1, updated: 0, error: 0, errorMessage: [] }))
    );

const createUserIfNotFound =
  (t: Transaction) =>
  (importedUser: UserInfo) =>
  (err: Error | "not-found") => {
    if (err === "not-found") {
      return processImportedUserAsCreate(t)(importedUser);
    }
    return TE.left(err);
  };

const importUser =
  (t: Transaction) =>
  (importedUser: UserInfo): TE.TaskEither<Error, ImportResult> =>
    pipe(
      processImportedUserAsUpdate(t)(importedUser),
      TE.orElse(createUserIfNotFound(t)(importedUser))
    );

export const importUsers = (
  importedUsers: readonly UserInfo[]
): TE.TaskEither<Error, ImportResult> =>
  transactionalTaskEither((t) =>
    pipe(
      importedUsers,
      RA.map(importUser(t)),
      TE.sequenceArray,
      TE.map(RA.foldMap(monoidImportResult)((x) => x))
    )
  );
