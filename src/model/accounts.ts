import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { PersistedAccount, PersistedUser, PersistedDelegate } from "./db/users";
import {
  AccountUserDetails,
  AccountUser,
  AccountUserWithDelegates,
} from "../interfaces/UserInfo";
import { findPersistedUser, savePersistedUser } from "./_internal/user";

interface PersistedAccountWithDelegates extends PersistedAccount {
  delegates: PersistedDelegate[];
}

interface PersistedUserWithAccount extends PersistedUser {
  source: "account";
  account: PersistedAccount;
}

interface PersistedUserWithAccountAndAccountDelegates
  extends PersistedUserWithAccount {
  account: PersistedAccountWithDelegates;
}

const isPersistedUserWithAccount: Refinement<
  PersistedUser,
  PersistedUserWithAccount
> = (pui): pui is PersistedUserWithAccount => pui.account !== undefined;

const isPersistedUserWithAccountAndAccountDelegates: Refinement<
  PersistedUserWithAccount,
  PersistedUserWithAccountAndAccountDelegates
> = (pui): pui is PersistedUserWithAccountAndAccountDelegates =>
  pui.account.delegates !== undefined;

const findPersistedUserWithAccountById = (t: Transaction) => (id: string) =>
  pipe(
    findPersistedUser("account")(t)(id),
    TE.chainW(
      TE.fromPredicate(
        isPersistedUserWithAccount,
        () => new Error(`Data error: user ${id} has no account`)
      )
    )
  );

const findPersistedUserWithAccountAndAccountDelegatesById =
  (t: Transaction) => (id: string) =>
    pipe(
      findPersistedUser([
        {
          model: PersistedAccount,
          as: "account",
          include: [{ model: PersistedDelegate, as: "delegates" }],
        },
      ])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithAccount,
          () => new Error(`Data error: user ${id} has no account`)
        )
      ),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithAccountAndAccountDelegates,
          () => new Error(`Data error: user ${id} has no delegates`)
        )
      )
    );

export const findAllAccounts = (
  t: Transaction
): TE.TaskEither<Error, AccountUserDetails[]> =>
  TE.tryCatch(
    () => PersistedAccount.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

export const findAccountUserWithDelegatesById =
  (t: Transaction) =>
  (
    id: string
  ): TE.TaskEither<Error | "not-found", AccountUserWithDelegates | null> =>
    findPersistedUserWithAccountAndAccountDelegatesById(t)(id);

const createPersistedUserWithAccount =
  (t: Transaction) => (userWithAccount: AccountUser) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedUser.create(
            {
              id: userWithAccount.id,
              enabled: userWithAccount.enabled,
              source: userWithAccount.source,
            },
            { transaction: t }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.bindTo("persistedUser"),
      TE.bind("persistedAccount", ({ persistedUser }) =>
        TE.tryCatch(
          () =>
            persistedUser.createAccount(
              {
                ...userWithAccount.account,
              },
              {
                transaction: t,
              }
            ),
          (reason) => new Error(String(reason))
        )
      ),
      TE.map(({ persistedUser, persistedAccount }) => {
        persistedUser.account = persistedAccount;
        return persistedUser;
      }),
      TE.chain(
        TE.fromPredicate(
          isPersistedUserWithAccount,
          () =>
            new Error(`Data error: user ${userWithAccount.id} has no account`)
        )
      )
    );

export const createAccountUser =
  (t: Transaction) => (userWithAccount: AccountUser) =>
    pipe(createPersistedUserWithAccount(t)(userWithAccount));

const applyUpdatesToPersistedUserInfoObject =
  (updates: Partial<AccountUser>) =>
  (user: PersistedUserWithAccount): PersistedUserWithAccount =>
    user.set(updates);

export const updateUserWithAccount =
  (t: Transaction) =>
  (
    id: string,
    updates: Partial<AccountUser>
  ): TE.TaskEither<Error | "not-found", AccountUser> =>
    pipe(
      findPersistedUserWithAccountById(t)(id),
      TE.map(applyUpdatesToPersistedUserInfoObject(updates)),
      TE.chainW(savePersistedUser(t))
    );
