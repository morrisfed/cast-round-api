import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/Array";

import {
  AccountUserWithDetails,
  AccountUserDetails,
  User,
} from "../interfaces/users";
import {
  findAccountUserWithDetailsById,
  findAllAccountsUserDetails,
} from "../model/account-users";
import transactionalTaskEither from "../model/transaction";
import {
  getAccountUserRoles,
  hasAccountsReadAllPermission,
} from "../user/permissions";
import { ModelRole } from "../model/interfaces/model-roles";

type AccountUserDetailsWithRoles = AccountUserDetails & {
  roles: ModelRole[];
};

type AccountUserWithDetailsWithRoles = AccountUserWithDetails & {
  account: AccountUserDetailsWithRoles;
};

const addAccountUserRoles = (
  accountUserDetails: AccountUserDetails
): AccountUserDetailsWithRoles => ({
  ...accountUserDetails,
  roles: getAccountUserRoles(accountUserDetails),
});

const addAccountUserRolesArray = A.map(addAccountUserRoles);

export const getAccounts = (
  user: User
): TE.TaskEither<
  Error | "forbidden",
  readonly AccountUserDetailsWithRoles[]
> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(findAllAccountsUserDetails(t), TE.map(addAccountUserRolesArray))
    );
  }
  return TE.left("forbidden");
};

export const getAccountUser = (
  user: User,
  accountId: string
): TE.TaskEither<
  Error | "forbidden" | "not-found",
  AccountUserWithDetailsWithRoles
> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findAccountUserWithDetailsById(t)(accountId),
        TE.chainW(TE.fromNullable("not-found" as const)),
        TE.map((accountUser) => ({
          ...accountUser,
          account: addAccountUserRoles(accountUser.account),
        }))
      )
    );
  }
  return TE.left("forbidden");
};
