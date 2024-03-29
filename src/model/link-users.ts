import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";

import { Transaction } from "sequelize";
import { PersistedUser, PersistedLinkUserDetails } from "./db/users";

import { deletePersistedUser, findPersistedUser } from "./_internal/user";
import {
  ModelBuildableLinkUser,
  ModelLinkUser,
  ModelLinkUserWithDetails,
  ModelBuildableLinkUserDetails,
} from "./interfaces/model-users";
import { decodePersistedIOE } from "./_internal/utils";

interface PersistedUserAsLinkUser extends PersistedUser {
  source: "link";
  link: PersistedLinkUserDetails;
}

const isPersistedUserWithLink: Refinement<
  PersistedUser,
  PersistedUserAsLinkUser
> = (pui): pui is PersistedUserAsLinkUser => pui.link !== undefined;

export const findAll = (
  t: Transaction
): TE.TaskEither<Error, PersistedLinkUserDetails[]> =>
  TE.tryCatch(
    () => PersistedLinkUserDetails.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

const persistedLinkUserModelLinkUser = (
  persistedLinkUser: PersistedUserAsLinkUser
): IOE.IOEither<Error, ModelLinkUser> =>
  decodePersistedIOE<PersistedUserAsLinkUser, ModelLinkUser, Error>(
    ModelLinkUser
  )(() => new Error("Invalid user info read from database"))(persistedLinkUser);

const persistedLinkUserModelLinkUserWithDetails = (
  persistedLinkUser: PersistedUserAsLinkUser
): IOE.IOEither<Error, ModelLinkUserWithDetails> =>
  decodePersistedIOE<PersistedUserAsLinkUser, ModelLinkUserWithDetails, Error>(
    ModelLinkUserWithDetails
  )(() => new Error("Invalid user info read from database"))(persistedLinkUser);

const createPersistedUserAsLinkUser =
  (t: Transaction) => (linkUser: ModelBuildableLinkUser) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedUser.create(
            {
              id: linkUser.id,
              enabled: linkUser.enabled,
              source: "link",
            },
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.bindTo("persistedUser"),
      TE.bind("persistedLinkUser", ({ persistedUser }) =>
        TE.tryCatch(
          () =>
            persistedUser.createLink(
              ModelBuildableLinkUserDetails.encode(linkUser.link),
              {
                transaction: t,
                include: [{ model: PersistedUser, as: "createdBy" }],
              }
            ),

          (reason) => new Error(String(reason))
        )
      ),
      TE.map(({ persistedUser, persistedLinkUser }) => {
        persistedUser.link = persistedLinkUser;
        return persistedUser;
      }),
      TE.chain(
        TE.fromPredicate(
          isPersistedUserWithLink,
          () => new Error(`Data error: user ${linkUser.id} has no link`)
        )
      )
    );

export const createLinkUser =
  (t: Transaction) =>
  (
    delegateUserInfo: ModelBuildableLinkUser
  ): TE.TaskEither<Error, ModelLinkUser> =>
    pipe(
      createPersistedUserAsLinkUser(t)(delegateUserInfo),
      TE.chainIOEitherKW(persistedLinkUserModelLinkUser)
    );

export const deleteLinkUser =
  (t: Transaction) =>
  (linkUserId: string): TE.TaskEither<Error, unknown> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedLinkUserDetails.destroy({
            where: { id: linkUserId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(() => deletePersistedUser(t)(linkUserId))
    );

export const findLinkUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", ModelLinkUserWithDetails> =>
    pipe(
      findPersistedUser(["link"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithLink,
          () => new Error(`Data error: user ${id} has no link`)
        )
      ),
      TE.chainIOEitherKW(persistedLinkUserModelLinkUserWithDetails)
    );
