import {
  isGroupAccountType,
  isIndividualAccountType,
} from "../accounts/accountTypes";
import { User } from "../interfaces/UserInfo";
import env from "../utils/env";

export type Permission =
  | "ADMINISTRATOR"
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
  | "EVENTS_WRITE_ALL";

export type Role =
  | "ADMINISTRATOR"
  | "MEMBER"
  | "GROUP_MEMBER"
  | "INDIVIDUAL_MEMBER"
  | "DELEGATE"
  | "GROUP_DELEGATE"
  | "GROUP_VOTER"
  | "INDIVIDUAL_VOTER"
  | "COMMITTEE";

export const isAdministratorRole = (user: User | undefined): boolean =>
  !!user && env.ADMIN_MW_ACCOUNT_IDS.split(",").includes(user.id);

export const isGroupMemberRole = (user: User | undefined): boolean =>
  isGroupAccountType(user?.account?.type);

export const isIndividualMemberRole = (user: User | undefined): boolean =>
  isIndividualAccountType(user?.account?.type);

export const isMemberRole = (user: User | undefined): boolean =>
  isGroupMemberRole(user) || isIndividualMemberRole(user);

export const isGroupDelegateRole = (user: User | undefined): boolean =>
  user?.delegate?.type === "group-delegate";

export const isDelegateRole = (user: User | undefined): boolean =>
  isGroupDelegateRole(user);

export const isGroupVoterRole = (user: User | undefined): boolean =>
  isGroupDelegateRole(user) || isGroupMemberRole(user);

export const isIndividualVoterRole = (user: User | undefined): boolean =>
  isIndividualMemberRole(user);

export const isCommitteeRole = (user: User | undefined): boolean =>
  user?.account?.type === "committee";

export const hasPermission = (
  user: User | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _permission: Permission
): boolean =>
  // Administrators have all permissions
  isAdministratorRole(user);

export const getPermissions = (user: User): Permission[] => {
  const allPermissions: Permission[] = [
    "ADMINISTRATOR",
    "ACCOUNTS_READ_ALL",
    "ACCOUNTS_WRITE_ALL",
    "DELEGATES_READ_ALL",
    "DELEGATES_READ_ALL_MEMBERS",
    "DELEGATES_READ_OWN",
    "DELEGATES_WRITE_ALL",
    "DELEGATES_WRITE_ALL_MEMBERS",
    "DELEGATES_WRITE_OWN",
    "EVENTS_READ_ALL",
    "EVENTS_READ_OWN",
    "EVENTS_READ_UNASSIGNED",
    "EVENTS_WRITE_ALL",
  ];

  return allPermissions.filter((permission) => hasPermission(user, permission));
};

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
  hasPermission(user, "EVENTS_READ_ALL");

export const hasEventsWriteAllPermission = (user: User | undefined) =>
  hasPermission(user, "EVENTS_WRITE_ALL");
