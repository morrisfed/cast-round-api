import * as TE from "fp-ts/lib/TaskEither";

import transactionalTaskEither from "../model/transaction";
import { LinkUserNoExpansion, User } from "../interfaces/users";
import { findUserById } from "../model/users";
import { findLinkUserById } from "../model/link-users";

export const getUser = (id: string): TE.TaskEither<Error | "not-found", User> =>
  transactionalTaskEither((t) => findUserById(t)(id));

export const getLinkUser = (
  id: string
): TE.TaskEither<Error | "not-found", LinkUserNoExpansion> =>
  transactionalTaskEither((t) => findLinkUserById(t)(id));
