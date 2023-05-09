import * as TE from "fp-ts/lib/TaskEither";
import { DelegateUserInfo, UserInfo } from "../interfaces/UserInfo";
import { hasDelegatesReadAllPermission } from "../user/permissions";
import transactionalTaskEither from "../model/transaction";
import { findAll } from "../model/delegates";

export const getDelegates = (
  user: UserInfo
): TE.TaskEither<Error | "forbidden", readonly DelegateUserInfo[]> => {
  if (hasDelegatesReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAll(t));
  }
  return TE.left("forbidden");
};
