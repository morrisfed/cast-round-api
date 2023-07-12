import { pipe } from "fp-ts/lib/function";
import { Refinement } from "fp-ts/lib/Refinement";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import {
  PersistedAccountUser,
  PersistedUser,
  PersistedLinkUser,
} from "./db/users";
import {
  BuildableLinkUser,
  LinkUser,
  LinkUserDetailsWithCreatedBy,
  LinkUserNoExpansion,
} from "../interfaces/users";
import { deletePersistedUser, findPersistedUser } from "./_internal/user";

interface PersistedUserAsLinkUser extends PersistedUser {
  source: "link";
  link: PersistedLinkUser;
}

const isPersistedUserWithLink: Refinement<
  PersistedUser,
  PersistedUserAsLinkUser
> = (pui): pui is PersistedUserAsLinkUser => pui.link !== undefined;

export const findAll = (
  t: Transaction
): TE.TaskEither<Error, PersistedLinkUser[]> =>
  TE.tryCatch(
    () => PersistedLinkUser.findAll({ transaction: t }),
    (reason) => new Error(String(reason))
  );

const createPersistedUserAsLinkUser =
  (t: Transaction) => (linkUser: BuildableLinkUser) =>
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
                  { model: PersistedAccountUser, as: "linkFor" },
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
  (delegateUserInfo: BuildableLinkUser): TE.TaskEither<Error, LinkUser> =>
    pipe(createPersistedUserAsLinkUser(t)(delegateUserInfo));

export const deleteLinkUser =
  (t: Transaction) =>
  (linkUserId: string): TE.TaskEither<Error, unknown> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedLinkUser.destroy({
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
  ): TE.TaskEither<Error, LinkUserDetailsWithCreatedBy[] | null> =>
    TE.tryCatch(
      () =>
        PersistedLinkUser.findAll({
          where: { linkForUserId: accountId },
          transaction: t,
          include: ["createdBy"],
        }),
      (reason) => new Error(String(reason))
    );

export const findLinkUserById =
  (t: Transaction) =>
  (id: string): TE.TaskEither<Error | "not-found", LinkUserNoExpansion> =>
    pipe(
      findPersistedUser(["link"])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithLink,
          () => new Error(`Data error: user ${id} has no link`)
        )
      ),
      TE.map((persistedUser) => ({
        id: persistedUser.id,
        source: persistedUser.source,
        enabled: persistedUser.enabled,
        link: {
          id: persistedUser.link.id,
          label: persistedUser.link.label,
          type: persistedUser.link.type,

          linkForUserId: persistedUser.link.linkForUserId,
          createdByUserId: persistedUser.link.createdByUserId,
        },
      }))
    );
