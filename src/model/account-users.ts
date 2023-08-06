import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";
import { PersistedAccountUserDetails, PersistedUser } from "./db/users";

import {
  findPersistedUserWithAccountAndAccountLinksById,
  findPersistedUserWithAccountById,
  isPersistedUserWithAccount,
  PersistedUserWithAccount,
  savePersistedUser,
} from "./_internal/user";
import {
  ModelAccountUser,
  ModelAccountUserDetails,
  ModelAccountUserDetailsUpdates,
  ModelAccountUserUpdates,
  ModelAccountUserWithLinks,
  ModelBuildableAccountUser,
} from "./interfaces/model-users";
import { decodePersistedIOE } from "./_internal/utils";

const persistedAccountUserDetailsAsModelAccountUserDetails = (
  persistedAccountUser: PersistedAccountUserDetails
): IOE.IOEither<Error, ModelAccountUserDetails> =>
  decodePersistedIOE<
    PersistedAccountUserDetails,
    ModelAccountUserDetails,
    Error
  >(ModelAccountUserDetails)(
    () => new Error("Invalid user info read from database")
  )(persistedAccountUser);

const persistedAccountUserDetailsArrayAsModelAccountUserDetailsArray = (
  persistedAccountUsers: PersistedAccountUserDetails[]
): IOE.IOEither<Error, ModelAccountUserDetails[]> =>
  pipe(
    persistedAccountUsers,
    A.traverse(IOE.ApplicativePar)(
      persistedAccountUserDetailsAsModelAccountUserDetails
    )
  );

const persistedAccountUserModelAccountUser = (
  persistedAccountUser: PersistedUserWithAccount
): IOE.IOEither<Error, ModelAccountUser> =>
  decodePersistedIOE<PersistedUserWithAccount, ModelAccountUser, Error>(
    ModelAccountUser
  )(() => new Error("Invalid user info read from database"))(
    persistedAccountUser
  );

const persistedAccountUserWithLinksAsModelAccountUserWithLinks = (
  persistedAccountUser: PersistedUserWithAccount
): IOE.IOEither<Error, ModelAccountUserWithLinks> =>
  decodePersistedIOE<
    PersistedUserWithAccount,
    ModelAccountUserWithLinks,
    Error
  >(ModelAccountUserWithLinks)(
    () => new Error("Invalid user info read from database")
  )(persistedAccountUser);

export const findAllAccounts = (
  t: Transaction
): TE.TaskEither<Error, ModelAccountUserDetails[]> =>
  pipe(
    TE.tryCatch(
      () => PersistedAccountUserDetails.findAll({ transaction: t }),
      (reason) => new Error(String(reason))
    ),
    TE.chainIOEitherKW(
      persistedAccountUserDetailsArrayAsModelAccountUserDetailsArray
    )
  );

export const findAccountUserWithLinksById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", ModelAccountUserWithLinks> =>
    pipe(
      findPersistedUserWithAccountAndAccountLinksById(t)(id),
      TE.chainIOEitherKW(
        persistedAccountUserWithLinksAsModelAccountUserWithLinks
      )
    );

const createPersistedUserWithAccount =
  (t: Transaction) => (userWithAccount: ModelBuildableAccountUser) =>
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
  (t: Transaction) => (userWithAccount: ModelAccountUser) =>
    pipe(createPersistedUserWithAccount(t)(userWithAccount));

const applyUpdatesToPersistedAccountUser =
  (updates: Omit<ModelAccountUserUpdates, "account">) =>
  (user: PersistedUserWithAccount): PersistedUserWithAccount =>
    user.set(updates);

const savePersistedAccount =
  (t: Transaction) => (pa: PersistedAccountUserDetails) =>
    TE.tryCatch(
      () => pa.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

const applyAndSaveUpdateToPersistedAccountUserDetails =
  (t: Transaction) =>
  (updates: ModelAccountUserDetailsUpdates | undefined) =>
  (pa: PersistedAccountUserDetails) =>
    pipe(pa.set(updates ?? {}), savePersistedAccount(t));

export const updateUserWithAccount =
  (t: Transaction) =>
  (
    id: string,
    updates: ModelAccountUserUpdates
  ): TE.TaskEither<Error | "not-found", ModelAccountUser> =>
    pipe(
      findPersistedUserWithAccountById(t)(id),
      TE.chainFirstW((pu) =>
        applyAndSaveUpdateToPersistedAccountUserDetails(t)(updates.account)(
          pu.account
        )
      ),
      TE.map(applyUpdatesToPersistedAccountUser(updates)),
      TE.chainW(savePersistedUser(t)),
      TE.chainIOEitherKW(persistedAccountUserModelAccountUser)
    );
