import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";

import { Transaction } from "sequelize";
import { PersistedUser } from "./db/users";
import { findPersistedUser } from "./_internal/user";
import { ModelUser } from "./interfaces/model-users";
import { decodePersistedIOE } from "./_internal/utils";

const persistedUserAsModelUser = (
  persistedUser: PersistedUser
): IOE.IOEither<Error, ModelUser> =>
  decodePersistedIOE<PersistedUser, ModelUser, Error>(ModelUser)(
    () => new Error("Invalid user info read from database")
  )(persistedUser);

export const findUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", ModelUser> =>
    pipe(
      findPersistedUser(["account", "link"])(t)(id),
      TE.chainIOEitherKW(persistedUserAsModelUser)
    );
