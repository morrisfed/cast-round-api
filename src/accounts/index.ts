import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import {
  AccountUser,
  AccountUserDetails,
  LinkUserDetailsWithCreatedBy,
  User,
} from "../interfaces/users";
import {
  findAccountUserWithLinksById,
  findAllAccounts,
} from "../model/account-users";
import transactionalTaskEither from "../model/transaction";
import { hasAccountsReadAllPermission } from "../user/permissions";
import { findLinkUsersDetailsWithCreatedByLinkUserForAccountId } from "../model/link-users";

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
        findAccountUserWithLinksById(t)(accountId),
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
    readonly LinkUserDetailsWithCreatedBy[]
  > => {
    if (hasAccountsReadAllPermission(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          findLinkUsersDetailsWithCreatedByLinkUserForAccountId(t)(accountId),
          TE.chainW(TE.fromNullable("account-not-found" as const))
        )
      );
    }
    return TE.left("forbidden");
  };
