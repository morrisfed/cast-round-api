import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { randomUUID } from "crypto";
import {
  AccountUserDetailsWithDelegates,
  BuildableDelegateUser,
  DelegateUser,
  DelegateUserDetails,
  User,
} from "../interfaces/UserInfo";
import {
  hasDelegatesReadAllPermission,
  hasDelegatesWriteAllMembersPermission,
  hasDelegatesWriteAllPermission,
  hasDelegatesWriteOwnPermission,
} from "../user/permissions";
import transactionalTaskEither from "../model/transaction";
import { createDelegateUser, findAll } from "../model/delegates";
import { isGroupAccountType } from "../accounts/accountTypes";
import { findAccountUserWithDelegatesById } from "../model/accounts";
import { CreateGroupDelegateRequest } from "./requests";

export const getDelegates = (
  user: User
): TE.TaskEither<Error | "forbidden", readonly DelegateUserDetails[]> => {
  if (hasDelegatesReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAll(t));
  }
  return TE.left("forbidden");
};

/**
 * Confirm the user has permission to create a group delegate for the given account ID.
 */
const hasPermissionToCreateGroupDelegateForAccount =
  (user: User) => (delegateForAccountId: string) =>
    hasDelegatesWriteAllPermission(user) ||
    hasDelegatesWriteAllMembersPermission(user) ||
    (hasDelegatesWriteOwnPermission(user) && user.id === delegateForAccountId);

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
    AccountUserDetailsWithDelegates
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
        findAccountUserWithDelegatesById(t)(delegateForAccountId),
        TE.chainW(TE.fromNullable("not-found" as const)),
        TE.map((accountUser) => accountUser.account)
      )
    );
  };

/**
 * Group delegates are associated with a group account. Users may have permission to create any group delegates,
 * or may only have permission to create group delegates for their own group account.
 * @param user The user requesting creation of a group delegate.
 * @returns The created group delegate.
 */
export const createGroupDelegate =
  (user: User) =>
  (
    createRequest: CreateGroupDelegateRequest
  ): TE.TaskEither<
    Error | "forbidden" | "invalid-delegate-for" | "not-found",
    DelegateUser
  > => {
    if (
      hasPermissionToCreateGroupDelegateForAccount(user)(
        createRequest.delegateForAccountId
      )
    ) {
      return transactionalTaskEither((t) =>
        pipe(
          getGroupAccountForDelegateCreation(user)(
            createRequest.delegateForAccountId
          ),
          TE.chainW(() => {
            const delegateUser: BuildableDelegateUser = {
              id: randomUUID(),
              enabled: true,
              source: "delegate",
              delegate: {
                label: createRequest.label,
                type: "group-delegate",
                delegateForUserId: createRequest.delegateForAccountId,
                createdByUserId: user.id,
              },
            };
            return createDelegateUser(t)(delegateUser);
          })
        )
      );
    }

    return TE.left("forbidden");
  };
