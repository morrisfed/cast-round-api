import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as S from "fp-ts/lib/Set";
import * as E from "fp-ts/lib/Eq";

import {
  isGroupAccountType,
  isIndividualAccountType,
} from "../accounts/accountTypes";
import { User } from "../interfaces/users";

export type Permission =
  | "IMPORT_ACCOUNTS_CSV"
  | "ACCOUNTS_READ_ALL"
  | "ACCOUNTS_WRITE_ALL"
  | "DELEGATES_READ_ALL"
  | "DELEGATES_READ_ALL_MEMBERS"
  | "DELEGATES_READ_OWN"
  | "DELEGATES_WRITE_ALL"
  | "DELEGATES_WRITE_ALL_MEMBERS"
  | "DELEGATES_WRITE_OWN"
  | "EVENTS_READ_ALL"
  | "EVENTS_READ_OWN"
  | "EVENTS_READ_UNASSIGNED"
  | "EVENTS_READWRITE_ALL"
  | "TELLOR_DEGATES_READWRITE";

export type Role =
  | "ADMINISTRATOR"
  | "MEMBER"
  | "GROUP_MEMBER"
  | "INDIVIDUAL_MEMBER"
  | "DELEGATE"
  | "GROUP_DELEGATE"
  | "GROUP_VOTER"
  | "INDIVIDUAL_VOTER"
  | "VOTER"
  | "TELLOR_DELEGATE"
  | "COMMITTEE";

const rolePermissions: Record<Role, Array<Permission>> = {
  ADMINISTRATOR: ["IMPORT_ACCOUNTS_CSV", "ACCOUNTS_READ_ALL"],
  COMMITTEE: [
    "ACCOUNTS_READ_ALL",
    "EVENTS_READWRITE_ALL",
    "TELLOR_DEGATES_READWRITE",
  ],
  MEMBER: ["EVENTS_READ_ALL"],
  GROUP_MEMBER: [],
  INDIVIDUAL_MEMBER: [],
  GROUP_DELEGATE: [],
  TELLOR_DELEGATE: [],
  VOTER: [],
  GROUP_VOTER: [],
  INDIVIDUAL_VOTER: [],
  DELEGATE: [],
};

const permissionEq = E.fromEquals<Permission>((x, y) => x === y);

export const isAdministratorRole = (user: User | undefined): boolean =>
  !!user && !!user.account?.isAdmin;

export const isGroupMemberRole = (user: User | undefined): boolean =>
  isGroupAccountType(user?.account?.type);

export const isIndividualMemberRole = (user: User | undefined): boolean =>
  isIndividualAccountType(user?.account?.type);

export const isMemberRole = (user: User | undefined): boolean =>
  isGroupMemberRole(user) || isIndividualMemberRole(user);

export const isGroupDelegateRole = (user: User | undefined): boolean =>
  user?.link?.type === "group-delegate";

export const isTellorDelegateRole = (user: User | undefined): boolean =>
  user?.link?.type === "tellor";

export const isDelegateRole = (user: User | undefined): boolean =>
  isGroupDelegateRole(user);

export const isGroupVoterRole = (user: User | undefined): boolean =>
  isGroupDelegateRole(user) || isGroupMemberRole(user);

export const isIndividualVoterRole = (user: User | undefined): boolean =>
  isIndividualMemberRole(user);

export const isVotorRole = (user: User | undefined): boolean =>
  isGroupVoterRole(user) || isIndividualVoterRole(user);

export const isCommitteeRole = (user: User | undefined): boolean =>
  user?.account?.type === "committee";

export const getRoles = (user: User): Role[] =>
  A.compact([
    isAdministratorRole(user) ? O.some("ADMINISTRATOR") : O.none,
    isMemberRole(user) ? O.some("MEMBER") : O.none,
    isGroupMemberRole(user) ? O.some("GROUP_MEMBER") : O.none,
    isIndividualMemberRole(user) ? O.some("INDIVIDUAL_MEMBER") : O.none,
    isCommitteeRole(user) ? O.some("COMMITTEE") : O.none,
    isDelegateRole(user) ? O.some("DELEGATE") : O.none,
    isGroupDelegateRole(user) ? O.some("GROUP_DELEGATE") : O.none,
    isTellorDelegateRole(user) ? O.some("TELLOR_DELEGATE") : O.none,
    isGroupVoterRole(user) ? O.some("GROUP_VOTER") : O.none,
    isIndividualVoterRole(user) ? O.some("INDIVIDUAL_VOTER") : O.none,
    isVotorRole(user) ? O.some("VOTER") : O.none,
  ]);

const getPermissionsForRole = (role: Role): Permission[] =>
  rolePermissions[role];

export const getPermissions: (user: User) => Set<Permission> = flow(
  getRoles,
  A.map(getPermissionsForRole),
  A.flatten,
  S.fromArray(permissionEq)
);

export const hasPermission = (
  user: User | undefined,
  permission: Permission
): boolean =>
  pipe(
    user,
    O.fromNullable,
    O.map(getPermissions),
    O.map(S.elem(permissionEq)(permission)),
    O.getOrElse(() => false)
  );

export const hasAccountsReadAllPermission = (user: User | undefined) =>
  hasPermission(user, "ACCOUNTS_READ_ALL");

export const hasDelegatesReadAllPermission = (user: User | undefined) =>
  hasPermission(user, "DELEGATES_READ_ALL");

export const hasDelegatesReadAllMembersPermission = (user: User | undefined) =>
  hasPermission(user, "DELEGATES_READ_ALL_MEMBERS");

export const hasDelegatesWriteAllPermission = (user: User | undefined) =>
  hasPermission(user, "DELEGATES_WRITE_ALL");

export const hasDelegatesWriteAllMembersPermission = (user: User | undefined) =>
  hasPermission(user, "DELEGATES_WRITE_ALL_MEMBERS");

export const hasDelegatesWriteOwnPermission = (user: User | undefined) =>
  hasPermission(user, "DELEGATES_WRITE_OWN");

export const hasEventsReadAllPermission = (user: User | undefined) =>
  hasPermission(user, "EVENTS_READ_ALL") ||
  hasPermission(user, "EVENTS_READWRITE_ALL");

export const hasEventsWriteAllPermission = (user: User | undefined) =>
  hasPermission(user, "EVENTS_READWRITE_ALL");
