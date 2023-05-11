import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { PersistedAccount, PersistedUser, PersistedDelegate } from "./db/users";
import {
  BuildableDelegateUser,
  DelegateUser,
  DelegateUserDetailsWithCreatedBy,
} from "../interfaces/UserInfo";

interface PersistedDelegateUser extends PersistedUser {
  source: "delegate";
  delegate: PersistedDelegate;
}

const isPersistedUserWithDelegate: Refinement<
  PersistedUser,
  PersistedDelegateUser
> = (pui): pui is PersistedDelegateUser => pui.delegate !== undefined;

export const findAll = (
  t: Transaction
): TE.TaskEither<Error, PersistedDelegate[]> =>
  TE.tryCatch(
    () => PersistedDelegate.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

const createPersistedDelegateUser =
  (t: Transaction) => (delegateUser: BuildableDelegateUser) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedUser.create(
            {
              id: delegateUser.id,
              enabled: delegateUser.enabled,
              source: "delegate",
            },
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.bindTo("persistedUser"),
      TE.bind("persistedDelegate", ({ persistedUser }) =>
        TE.tryCatch(
          () =>
            persistedUser.createDelegate(
              {
                ...delegateUser.delegate,
              },
              {
                transaction: t,
                include: [
                  { model: PersistedUser, as: "createdBy" },
                  { model: PersistedAccount, as: "delegateFor" },
                ],
              }
            ),

          (reason) => new Error(String(reason))
        )
      ),
      TE.map(({ persistedUser, persistedDelegate }) => {
        persistedUser.delegate = persistedDelegate;
        return persistedUser;
      }),
      TE.chain(
        TE.fromPredicate(
          isPersistedUserWithDelegate,
          () => new Error(`Data error: user ${delegateUser.id} has no delegate`)
        )
      )
    );

export const createDelegateUser =
  (t: Transaction) =>
  (
    delegateUserInfo: BuildableDelegateUser
  ): TE.TaskEither<Error, DelegateUser> =>
    pipe(createPersistedDelegateUser(t)(delegateUserInfo));

export const findDelegatesWithCreatedByByDelegateForAccountId =
  (t: Transaction) =>
  (
    accountId: string
  ): TE.TaskEither<Error, DelegateUserDetailsWithCreatedBy[] | null> =>
    TE.tryCatch(
      () =>
        PersistedDelegate.findAll({
          where: { delegateForUserId: accountId },
          transaction: t,
          include: ["createdBy"],
        }),
      (reason) => new Error(String(reason))
    );
