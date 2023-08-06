import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { Refinement } from "fp-ts/lib/Refinement";

import { FindOptions, Transaction } from "sequelize";
import {
  PersistedAccountUserDetails,
  PersistedLinkUserDetails,
  PersistedUser,
} from "../db/users";

export const findPersistedUser =
  (include: FindOptions["include"]) => (t: Transaction) => (id: string) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedUser.findByPk(id, {
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const savePersistedUser =
  <T extends PersistedUser>(t: Transaction) =>
  (userInfo: T) =>
    TE.tryCatch(
      () => userInfo.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );

export const deletePersistedUser = (t: Transaction) => (id: string) =>
  TE.tryCatch(
    () => PersistedUser.destroy({ where: { id }, transaction: t }),
    (reason) => new Error(String(reason))
  );

export interface PersistedUserWithAccount extends PersistedUser {
  source: "account";
  account: PersistedAccountUserDetails;
}

interface PersistedAccountWithLinks extends PersistedAccountUserDetails {
  links: PersistedLinkUserDetails[];
}

interface PersistedUserWithAccountAndAccountLinks
  extends PersistedUserWithAccount {
  account: PersistedAccountWithLinks;
}

export const isPersistedUserWithAccount: Refinement<
  PersistedUser,
  PersistedUserWithAccount
> = (pui): pui is PersistedUserWithAccount => pui.account !== undefined;

export const isPersistedUserWithAccountAndAccountLinks: Refinement<
  PersistedUserWithAccount,
  PersistedUserWithAccountAndAccountLinks
> = (pui): pui is PersistedUserWithAccountAndAccountLinks =>
  pui.account.links !== undefined;

export const findPersistedUserWithAccountById =
  (t: Transaction) => (id: string) =>
    pipe(
      findPersistedUser("account")(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithAccount,
          () => new Error(`Data error: user ${id} has no account`)
        )
      )
    );

export const findPersistedUserWithAccountAndAccountLinksById =
  (t: Transaction) => (id: string) =>
    pipe(
      findPersistedUser([
        {
          model: PersistedAccountUserDetails,
          as: "account",
          include: [{ model: PersistedLinkUserDetails, as: "links" }],
        },
      ])(t)(id),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithAccount,
          () => new Error(`Data error: user ${id} has no account`)
        )
      ),
      TE.chainW(
        TE.fromPredicate(
          isPersistedUserWithAccountAndAccountLinks,
          () => new Error(`Data error: user ${id} has no links`)
        )
      )
    );
