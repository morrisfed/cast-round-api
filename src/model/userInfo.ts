import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import { UserInfo } from "../interfaces/UserInfo";
import PersistedUserInfo from "./db/UserInfo";

const findPersistedUserInfoById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", PersistedUserInfo> =>
    pipe(
      TE.tryCatch(
        () => PersistedUserInfo.findByPk(id, { transaction: t }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const findUserInfoById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", UserInfo> =>
    findPersistedUserInfoById(t)(id);

const createPersistedUserInfo = (
  userInfo: UserInfo
): TE.TaskEither<Error, UserInfo> =>
  TE.tryCatch(
    () => PersistedUserInfo.create(userInfo),
    (reason) => new Error(String(reason))
  );

const applyUpdatesToPersistedUserInfoObject =
  (updates: Partial<UserInfo>) =>
  (userInfo: PersistedUserInfo): PersistedUserInfo =>
    userInfo.set(updates);

const savePersistedUserInfo =
  (t: Transaction) =>
  (userInfo: PersistedUserInfo): TE.TaskEither<Error, UserInfo> =>
    TE.tryCatch(
      () => userInfo.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

export const createUserInfo = (
  userInfo: UserInfo
): TE.TaskEither<Error, UserInfo> => pipe(createPersistedUserInfo(userInfo));

export const updateUserInfo =
  (t: Transaction) =>
  (
    id: string,
    updates: Partial<UserInfo>
  ): TE.TaskEither<Error | "not-found", UserInfo> =>
    pipe(
      findPersistedUserInfoById(t)(id),
      TE.map(applyUpdatesToPersistedUserInfoObject(updates)),
      TE.chainW(savePersistedUserInfo(t))
    );
