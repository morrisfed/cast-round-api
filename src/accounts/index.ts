import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import {
  AccountUser,
  AccountUserDetails,
  DelegateUserDetailsWithCreatedBy,
  User,
} from "../interfaces/UserInfo";
import {
  findAccountUserWithDelegatesById,
  findAllAccounts,
} from "../model/accounts";
import transactionalTaskEither from "../model/transaction";
import { hasAccountsReadAllPermission } from "../user/permissions";
import { findDelegatesWithCreatedByByDelegateForAccountId } from "../model/delegates";

export const getAccounts = (
  user: User
): TE.TaskEither<Error | "forbidden", readonly AccountUserDetails[]> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllAccounts(t));
  }
  return TE.left("forbidden");
};

export const getAccountUser = (
  user: User,
  accountId: string
): TE.TaskEither<Error | "forbidden" | "not-found", AccountUser> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findAccountUserWithDelegatesById(t)(accountId),
        TE.chainW(TE.fromNullable("not-found" as const))
      )
    );
  }
  return TE.left("forbidden");
};

export const getAccountDelegates =
  (user: User) =>
  (
    accountId: string
  ): TE.TaskEither<
    Error | "forbidden" | "account-not-found",
    readonly DelegateUserDetailsWithCreatedBy[]
  > => {
    if (hasAccountsReadAllPermission(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          findDelegatesWithCreatedByByDelegateForAccountId(t)(accountId),
          TE.chainW(TE.fromNullable("account-not-found" as const))
        )
      );
    }
    return TE.left("forbidden");
  };
