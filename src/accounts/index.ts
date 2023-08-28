import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

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
import { hasAccountsReadAllPermission } from "../user/permissions";

export const getAccounts = (
  user: User
): TE.TaskEither<Error | "forbidden", readonly AccountUserDetails[]> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllAccountsUserDetails(t));
  }
  return TE.left("forbidden");
};

export const getAccountUser = (
  user: User,
  accountId: string
): TE.TaskEither<Error | "forbidden" | "not-found", AccountUserWithDetails> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findAccountUserWithDetailsById(t)(accountId),
        TE.chainW(TE.fromNullable("not-found" as const))
      )
    );
  }
  return TE.left("forbidden");
};
