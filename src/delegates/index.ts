import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { randomUUID } from "crypto";
import {
  AccountUserDetailsWithLinks,
  BuildableLinkUser,
  User,
} from "../interfaces/users";
import {
  hasDelegatesReadAllPermission,
  hasDelegatesWriteAllMembersPermission,
  hasDelegatesWriteAllPermission,
  hasGroupDelegatesReadOwnPermission,
  hasGroupDelegatesWriteOwnPermission,
} from "../user/permissions";
import transactionalTaskEither from "../model/transaction";
import { createLinkUser } from "../model/link-users";
import {
  findEventGroupDelegateByAccountAndEvent,
  createEventGroupDelegate as modelCreateEventGroupDelegate,
} from "../model/event-group-delegates";
import { isGroupAccountType } from "../accounts/accountTypes";
import { findAccountUserWithLinksById } from "../model/account-users";
import { CreateEventGroupDelegateRequest } from "./requests";
import { getEvent } from "../events";
import { EventGroupDelegate } from "../interfaces/events";

const hasPermissionToReadGroupDelegateForAccount =
  (user: User) => (accountId: string) =>
    hasDelegatesReadAllPermission(user) ||
    (hasGroupDelegatesReadOwnPermission(user) && user.id === accountId);

/**
 * Confirm the user has permission to create a group delegate for the given account ID.
 */
const hasPermissionToCreateGroupDelegateForAccount =
  (user: User) => (delegateForAccountId: string) =>
    hasDelegatesWriteAllPermission(user) ||
    hasDelegatesWriteAllMembersPermission(user) ||
    (hasGroupDelegatesWriteOwnPermission(user) &&
      user.id === delegateForAccountId);

export const getEventGroupDelegate =
  (user: User) =>
  (
    eventId: number
  ): TE.TaskEither<Error | "forbidden" | "not-found", EventGroupDelegate> => {
    if (hasPermissionToReadGroupDelegateForAccount(user)(user.id)) {
      return transactionalTaskEither((t) =>
        pipe(findEventGroupDelegateByAccountAndEvent(t)(eventId)(user.id))
      );
    }

    return TE.left("forbidden" as const);
  };

/**
 * Retrieve the AccountUserInfo object for the group account that the delegate is being created for.
 * @param user The user requesting creation of a group delegate.
 * @param delegateForAccountId The ID of the account that the delegate is being created for.
 * @returns TaskEither of the AccountUserInfo object for the group account that the delegate is being created for.
 */
const getGroupAccountForDelegateCreation =
  (user: User) =>
  (
    delegateForAccountId: string
  ): TE.TaskEither<
    Error | "invalid-delegate-for" | "not-found",
    AccountUserDetailsWithLinks
  > => {
    // If the current user is the account user that the delegate is being created for, then return
    // the already loaded AccountUserInfo object.
    if (user.id === delegateForAccountId && user.account) {
      if (!isGroupAccountType(user.account.type)) {
        return TE.left("invalid-delegate-for");
      }

      return TE.right(user.account);
    }

    return transactionalTaskEither((t) =>
      pipe(
        findAccountUserWithLinksById(t)(delegateForAccountId),
        TE.chainW(TE.fromNullable("not-found" as const)),
        TE.map((accountUser) => accountUser.account)
      )
    );
  };

export const createEventGroupDelegate =
  (user: User) => (createRequest: CreateEventGroupDelegateRequest) => {
    if (
      hasPermissionToCreateGroupDelegateForAccount(user)(
        createRequest.delegateForAccountUserId
      )
    ) {
      return transactionalTaskEither((t) =>
        pipe(
          TE.Do,
          TE.bind("groupAccount", () =>
            getGroupAccountForDelegateCreation(user)(
              createRequest.delegateForAccountUserId
            )
          ),
          TE.bindW("event", () => getEvent(user, createRequest.eventId)),
          TE.bindW("linkUser", ({ groupAccount, event }) => {
            const id = randomUUID();
            const linkUser: BuildableLinkUser = {
              id,
              enabled: true,
              source: "link",
              link: {
                id,
                label: createRequest.label,
                type: "group-delegate",
                createdByUserId: user.id,
                info: {
                  infoSchemaVersion: 1,
                  delegateForGroupId: groupAccount.id,
                  delegateForGroupName: groupAccount.name,
                  delegateForEventId: event.id,
                },
              },
            };
            return createLinkUser(t)(linkUser);
          }),
          TE.chainW(({ linkUser, event, groupAccount }) =>
            modelCreateEventGroupDelegate(t)({
              eventId: event.id,
              delegateUserId: linkUser.id,
              delegateForUserId: groupAccount.id,
            })
          )
        )
      );
    }

    return TE.left("forbidden" as const);
  };
