import * as TE from "fp-ts/lib/TaskEither";

import transactionalTaskEither from "../model/transaction";
import { User } from "../interfaces/UserInfo";
import { findUserById } from "../model/userInfo";

export const getUser = (id: string): TE.TaskEither<Error | "not-found", User> =>
  transactionalTaskEither((t) => findUserById(t)(id));
