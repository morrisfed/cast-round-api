import * as TE from "fp-ts/lib/TaskEither";

import { AccountUserInfo, UserInfo } from "../interfaces/UserInfo";
import { findAll } from "../model/accounts";
import transactionalTaskEither from "../model/transaction";
import { hasAccountsReadAllPermission } from "../user/permissions";

export const getAccounts = (
  user: UserInfo
): TE.TaskEither<Error | "forbidden", readonly AccountUserInfo[]> => {
  if (hasAccountsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAll(t));
  }
  return TE.left("forbidden");
};
