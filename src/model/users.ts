import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import { User, UserSource } from "../interfaces/users";
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
        id: persistedUser.account.id,
        name: persistedUser.account.name,
        contactName: persistedUser.account.contactName,
        type: persistedUser.account.type,
        isAdmin: persistedUser.account.isAdmin,
      },
    });
  }

  if (persistedUser.link) {
    return TE.of({
      source: "link",
      id: persistedUser.id,
      enabled: persistedUser.enabled,
      link: {
        label: persistedUser.link.label,
        type: persistedUser.link.type,
      },
    } as User);
  }

  return TE.left(new Error("Invalid user info read from database"));
};

export const findUserById = (t: Transaction) => (id: string) =>
  pipe(
    findPersistedUser(["account", "link"])(t)(id),
    TE.chainW(persistedUserAsUserInfoTE)
  );

export const findAllBySource =
  (t: Transaction) =>
  (source: UserSource): TE.TaskEither<Error, PersistedUser[]> =>
    TE.tryCatch(
      () => PersistedUser.findAll({ where: { source }, transaction: t }),
      (reason) => new Error(String(reason))
    );
