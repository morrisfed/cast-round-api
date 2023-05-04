import * as TE from "fp-ts/lib/TaskEither";

import transactionalTaskEither from "../model/transaction";
import { UserInfo } from "../interfaces/UserInfo";
import { findUserInfoById } from "../model/userInfo";

export const getUserInfo = (
  id: string
): TE.TaskEither<Error | "not-found", UserInfo> =>
  transactionalTaskEither((t) => findUserInfoById(t)(id));
