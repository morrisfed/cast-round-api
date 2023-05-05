import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import {
  AccountUserInfo,
  DelegateUserInfo,
  UserInfo,
  UserSource,
} from "../interfaces/UserInfo";
import { PersistedCommonUserInfo } from "./db/UserInfo";

const findCommonUserInfoById = (t: Transaction) => (id: string) =>
  pipe(
    TE.tryCatch(
      () =>
        PersistedCommonUserInfo.findByPk(id, {
          transaction: t,
          include: ["account", "delegate"],
        }),
      (reason) => new Error(String(reason))
    ),
    TE.chainW(TE.fromNullable("not-found" as const))
  );

const persistedUserAsUserInfoTE = (
  persistedUser: PersistedCommonUserInfo
): TE.TaskEither<Error, UserInfo> => {
  if (persistedUser.account) {
    return TE.of({
      source: "account",
      id: persistedUser.id,
      enabled: persistedUser.enabled,
      account: {
        name: persistedUser.account.name,
        contactName: persistedUser.account.contactName,
        type: persistedUser.account.type,
      },
    } as UserInfo);
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
    } as UserInfo);
  }

  return TE.left(new Error("Invalid user info read from database"));
};

export const findUserInfoById = (t: Transaction) => (id: string) =>
  pipe(findCommonUserInfoById(t)(id), TE.chainW(persistedUserAsUserInfoTE));

export const findAllBySource =
  (t: Transaction) =>
  (source: UserSource): TE.TaskEither<Error, PersistedCommonUserInfo[]> =>
    TE.tryCatch(
      () =>
        PersistedCommonUserInfo.findAll({ where: { source }, transaction: t }),
      (reason) => new Error(String(reason))
    );

// export const findAllByType =
//   (t: Transaction) =>
//   (type: UserType): TE.TaskEither<Error, PersistedCommonUserInfo[]> =>
//     TE.tryCatch(
//       () =>
//         PersistedCommonUserInfo.findAll({ where: { type }, transaction: t }),
//       (reason) => new Error(String(reason))
//     );

const createAccountForPersistedUserInfo =
  (t: Transaction) =>
  (account: AccountUserInfo) =>
  (persistedUserInfo: PersistedCommonUserInfo) =>
    pipe(
      TE.tryCatch(
        () => persistedUserInfo.createAccount(account, { transaction: t }),
        (reason) => new Error(String(reason))
      ),
      TE.map(() => persistedUserInfo)
    );

const createDelegateForPersistedUserInfo =
  (t: Transaction) =>
  (delegate: DelegateUserInfo) =>
  (persistedUserInfo: PersistedCommonUserInfo) =>
    pipe(
      TE.tryCatch(
        () => persistedUserInfo.createDelegate(delegate, { transaction: t }),
        (reason) => new Error(String(reason))
      ),
      TE.map(() => persistedUserInfo)
    );

const createAccountOrDelegateForPersistedUserInfo =
  (t: Transaction) =>
  (userInfo: UserInfo) =>
  (persistedUserInfo: PersistedCommonUserInfo) => {
    if (userInfo.account) {
      return createAccountForPersistedUserInfo(t)(userInfo.account)(
        persistedUserInfo
      );
    }
    if (userInfo.delegate) {
      return createDelegateForPersistedUserInfo(t)(userInfo.delegate)(
        persistedUserInfo
      );
    }
    return TE.left(new Error("Invalid user info"));
  };

const createPersistedUserInfo = (t: Transaction) => (userInfo: UserInfo) =>
  pipe(
    PersistedCommonUserInfo.build(
      {
        id: userInfo.id,
        enabled: userInfo.enabled,
        source: userInfo.source,
      },
      { include: ["account", "delegate"] }
    ),
    TE.tryCatchK(
      (pui) => pui.save({ transaction: t }),
      (reason) => new Error(String(reason))
    ),
    TE.chainFirst(createAccountOrDelegateForPersistedUserInfo(t)(userInfo))
  );

const applyUpdatesToPersistedUserInfoObject =
  (updates: Partial<UserInfo>) =>
  (userInfo: PersistedCommonUserInfo): PersistedCommonUserInfo =>
    userInfo.set(updates);

const savePersistedUserInfo =
  (t: Transaction) => (userInfo: PersistedCommonUserInfo) =>
    TE.tryCatch(
      () => userInfo.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

export const createUserInfo = (t: Transaction) => (userInfo: UserInfo) =>
  pipe(TE.of(userInfo), TE.chain(createPersistedUserInfo(t)));

export const updateUserInfo =
  (t: Transaction) =>
  (
    id: string,
    updates: Partial<UserInfo>
  ): TE.TaskEither<Error | "not-found", UserInfo> =>
    pipe(
      findCommonUserInfoById(t)(id),
      TE.map(applyUpdatesToPersistedUserInfoObject(updates)),
      TE.chainW(savePersistedUserInfo(t))
    );
