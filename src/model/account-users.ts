import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import {
  PersistedAccountUser,
  PersistedUser,
  PersistedLinkUser,
} from "./db/users";
import {
  AccountUserDetails,
  AccountUser,
  AccountUserWithLinks,
  BuildableAccountUser,
} from "../interfaces/users";
import { findPersistedUser, savePersistedUser } from "./_internal/user";

interface PersistedAccountWithLinks extends PersistedAccountUser {
  links: PersistedLinkUser[];
}

interface PersistedUserWithAccount extends PersistedUser {
  source: "account";
  account: PersistedAccountUser;
}

interface PersistedUserWithAccountAndAccountLinks
  extends PersistedUserWithAccount {
  account: PersistedAccountWithLinks;
}

const isPersistedUserWithAccount: Refinement<
  PersistedUser,
  PersistedUserWithAccount
> = (pui): pui is PersistedUserWithAccount => pui.account !== undefined;

const isPersistedUserWithAccountAndAccountLinks: Refinement<
  PersistedUserWithAccount,
  PersistedUserWithAccountAndAccountLinks
> = (pui): pui is PersistedUserWithAccountAndAccountLinks =>
  pui.account.links !== undefined;

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

const findPersistedUserWithAccountAndAccountLinksById =
  (t: Transaction) => (id: string) =>
    pipe(
      findPersistedUser([
        {
          model: PersistedAccountUser,
          as: "account",
          include: [{ model: PersistedLinkUser, as: "links" }],
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
          isPersistedUserWithAccountAndAccountLinks,
          () => new Error(`Data error: user ${id} has no links`)
        )
      )
    );

export const findAllAccounts = (
  t: Transaction
): TE.TaskEither<Error, AccountUserDetails[]> =>
  TE.tryCatch(
    () => PersistedAccountUser.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

export const findAccountUserWithLinksById =
  (t: Transaction) =>
  (
    id: string
  ): TE.TaskEither<Error | "not-found", AccountUserWithLinks | null> =>
    findPersistedUserWithAccountAndAccountLinksById(t)(id);

const createPersistedUserWithAccount =
  (t: Transaction) => (userWithAccount: BuildableAccountUser) =>
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

const savePersistedAccount = (t: Transaction) => (pa: PersistedAccountUser) =>
  TE.tryCatch(
    () => pa.save({ transaction: t }),
    (reason) => new Error(String(reason))
  );

const applyAndSaveUpdateToPersistedAccount =
  (t: Transaction) =>
  (updates: Partial<AccountUserDetails> | undefined) =>
  (pa: PersistedAccountUser) =>
    pipe(pa.set(updates ?? {}), savePersistedAccount(t));

export const updateUserWithAccount =
  (t: Transaction) =>
  (
    id: string,
    updates: Partial<AccountUser>
  ): TE.TaskEither<Error | "not-found", AccountUser> =>
    pipe(
      findPersistedUserWithAccountById(t)(id),
      TE.chainFirstW((pu) =>
        applyAndSaveUpdateToPersistedAccount(t)(updates.account)(pu.account)
      ),
      TE.map(applyUpdatesToPersistedUserInfoObject(updates)),
      TE.chainW(savePersistedUser(t))
    );
