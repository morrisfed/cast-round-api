import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";
import {
  PersistedAccountUserDetails,
  PersistedUser,
  PersistedLinkUserDetails,
} from "./db/users";

import { deletePersistedUser, findPersistedUser } from "./_internal/user";
import {
  ModelBuildableLinkUser,
  ModelLinkUserDetailsWithCreatedBy,
  ModelLinkUserNoExpansion,
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

const persistedLinkUserModelLinkUserNoExpansion = (
  persistedLinkUser: PersistedUserAsLinkUser
): IOE.IOEither<Error, ModelLinkUserNoExpansion> =>
  decodePersistedIOE<PersistedUserAsLinkUser, ModelLinkUserNoExpansion, Error>(
    ModelLinkUserNoExpansion
  )(() => new Error("Invalid user info read from database"))(persistedLinkUser);

const persistedLinkUserDetailsAsModelLinkUserDetailsWithCreatedBy = (
  persistedLinkUserDetails: PersistedLinkUserDetails
): IOE.IOEither<Error, ModelLinkUserDetailsWithCreatedBy> =>
  decodePersistedIOE<
    PersistedLinkUserDetails,
    ModelLinkUserDetailsWithCreatedBy,
    Error
  >(ModelLinkUserDetailsWithCreatedBy)(
    () => new Error("Invalid user info read from database")
  )(persistedLinkUserDetails);

const persistedLinkUserDetailsArrayAsModelLinkUserDetailsWithCreatedByArray = (
  persistedLinkUserDetailsArray: PersistedLinkUserDetails[]
): IOE.IOEither<Error, ModelLinkUserDetailsWithCreatedBy[]> =>
  pipe(
    persistedLinkUserDetailsArray,
    A.traverse(IOE.ApplicativePar)(
      persistedLinkUserDetailsAsModelLinkUserDetailsWithCreatedBy
    )
  );

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
              {
                ...linkUser.link,
              },
              {
                transaction: t,
                include: [
                  { model: PersistedUser, as: "createdBy" },
                  { model: PersistedAccountUserDetails, as: "linkFor" },
                ],
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
  ): TE.TaskEither<Error, ModelLinkUserNoExpansion> =>
    pipe(
      createPersistedUserAsLinkUser(t)(delegateUserInfo),
      TE.chainIOEitherKW(persistedLinkUserModelLinkUserNoExpansion)
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

export const findLinkUsersDetailsWithCreatedByLinkUserForAccountId =
  (t: Transaction) =>
  (
    accountId: string
  ): TE.TaskEither<Error, ModelLinkUserDetailsWithCreatedBy[] | null> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedLinkUserDetails.findAll({
            where: { linkForUserId: accountId },
            transaction: t,
            include: ["createdBy"],
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainIOEitherKW(
        persistedLinkUserDetailsArrayAsModelLinkUserDetailsWithCreatedByArray
      )
    );

export const findLinkUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", ModelLinkUserNoExpansion> =>
    pipe(
      findPersistedUser(["link"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithLink,
          () => new Error(`Data error: user ${id} has no link`)
        )
      ),
      TE.chainIOEitherKW(persistedLinkUserModelLinkUserNoExpansion)
    );
