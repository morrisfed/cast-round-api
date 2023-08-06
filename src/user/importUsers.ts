import * as TE from "fp-ts/lib/TaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { Monoid } from "fp-ts/lib/Monoid";

import { Transaction } from "sequelize";
import { AccountUser } from "../interfaces/users";
import transactionalTaskEither from "../model/transaction";
import {
  createAccountUser,
  updateUserWithAccount,
} from "../model/account-users";

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
  (
    importableUser: AccountUser
  ): TE.TaskEither<Error | "not-found", ImportResult> =>
    pipe(
      updateUserWithAccount(t)(importableUser.id, importableUser),
      TE.map(() => ({
        created: 0,
        updated: 1,
        error: 0,
        errorMessage: [],
      }))
    );

const processImportedUserAsCreate =
  (t: Transaction) =>
  (importedUser: AccountUser): TE.TaskEither<Error, ImportResult> =>
    pipe(
      TE.of(importedUser),
      TE.chain(createAccountUser(t)),
      TE.map(() => ({ created: 1, updated: 0, error: 0, errorMessage: [] }))
    );

const createUserIfNotFound =
  (t: Transaction) =>
  (importedUser: AccountUser) =>
  (err: Error | "not-found") => {
    if (err === "not-found") {
      return processImportedUserAsCreate(t)(importedUser);
    }
    return TE.left(err);
  };

const importUser =
  (t: Transaction) =>
  (importableUser: AccountUser): TE.TaskEither<Error, ImportResult> =>
    pipe(
      processImportedUserAsUpdate(t)(importableUser),
      TE.orElse(createUserIfNotFound(t)(importableUser))
    );

export const importUsers = (
  importableUsers: readonly AccountUser[]
): TE.TaskEither<Error, ImportResult> =>
  transactionalTaskEither((t) =>
    pipe(
      importableUsers,
      RA.map(importUser(t)),
      TE.sequenceArray,
      TE.map(RA.foldMap(monoidImportResult)((x) => x))
    )
  );
