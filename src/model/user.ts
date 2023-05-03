import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import { User } from "../interfaces/User";
import PersistedUser from "./db/user";

const findPersistedUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", PersistedUser> =>
    pipe(
      TE.tryCatch(
        () => PersistedUser.findByPk(id, { transaction: t }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const findUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", User> =>
    findPersistedUserById(t)(id);

const createPersistedUser = (user: User): TE.TaskEither<Error, User> =>
  TE.tryCatch(
    () => PersistedUser.create(user),
    (reason) => new Error(String(reason))
  );

const applyUpdatesToPersistedUserObject =
  (updates: Partial<User>) =>
  (user: PersistedUser): PersistedUser =>
    user.set(updates);

const savePersistedUser =
  (t: Transaction) =>
  (user: PersistedUser): TE.TaskEither<Error, User> =>
    TE.tryCatch(
      () => user.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

export const createUser = (user: User): TE.TaskEither<Error, User> =>
  pipe(createPersistedUser(user));

export const updateUser =
  (t: Transaction) =>
  (
    id: string,
    updates: Partial<User>
  ): TE.TaskEither<Error | "not-found", User> =>
    pipe(
      findPersistedUserById(t)(id),
      TE.map(applyUpdatesToPersistedUserObject(updates)),
      TE.chainW(savePersistedUser(t))
    );
