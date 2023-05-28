import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import { User, UserSource } from "../interfaces/UserInfo";
import { PersistedUser } from "./db/users";
import { findPersistedUser } from "./_internal/user";

const persistedUserAsUserInfoTE = (
  persistedUser: PersistedUser
): TE.TaskEither<Error, User> => {
  if (persistedUser.account) {
    return TE.of({
      source: "account",
      id: persistedUser.id,
      enabled: persistedUser.enabled,
      account: {
        name: persistedUser.account.name,
        contactName: persistedUser.account.contactName,
        type: persistedUser.account.type,
        isAdmin: persistedUser.account.isAdmin,
        userId: persistedUser.account.userId,
      },
    });
  }

  if (persistedUser.delegate) {
    return TE.of({
      source: "delegate",
      id: persistedUser.id,
      enabled: persistedUser.enabled,
      delegate: {
        label: persistedUser.delegate.label,
        type: persistedUser.delegate.type,
      },
    } as User);
  }

  return TE.left(new Error("Invalid user info read from database"));
};

export const findUserById = (t: Transaction) => (id: string) =>
  pipe(
    findPersistedUser(["account", "delegate"])(t)(id),
    TE.chainW(persistedUserAsUserInfoTE)
  );

export const findAllBySource =
  (t: Transaction) =>
  (source: UserSource): TE.TaskEither<Error, PersistedUser[]> =>
    TE.tryCatch(
      () => PersistedUser.findAll({ where: { source }, transaction: t }),
      (reason) => new Error(String(reason))
    );
