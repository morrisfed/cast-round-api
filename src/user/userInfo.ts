import * as TE from "fp-ts/lib/TaskEither";

import transactionalTaskEither from "../model/transaction";
import {
  AccountUserWithDetails,
  LinkUserWithDetails,
} from "../interfaces/users";
import { findLinkUserById } from "../model/link-users";
import { findAccountUserWithDetailsById } from "../model/account-users";

export const getLinkUser = (
  id: string
): TE.TaskEither<Error | "not-found", LinkUserWithDetails> =>
  transactionalTaskEither((t) => findLinkUserById(t)(id));

export const getAccountUser = (
  id: string
): TE.TaskEither<Error | "not-found", AccountUserWithDetails> =>
  transactionalTaskEither((t) => findAccountUserWithDetailsById(t)(id));

export const getUser = (id: string, authVia: Express.User["authVia"]) =>
  authVia === "membership-works" ? getAccountUser(id) : getLinkUser(id);
