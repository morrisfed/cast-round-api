import { UserInfo } from "../interfaces/UserInfo";
import env from "../utils/env";

export type Permission =
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

export const isAdministratorRole = (user: UserInfo | undefined): boolean =>
  !!user && env.ADMIN_MW_ACCOUNT_IDS.split(",").includes(user.id);

export const isGroupMemberRole = (user: UserInfo | undefined): boolean =>
  user?.account?.type === "group-membership" ||
  user?.account?.type === "junior-membership" ||
  user?.account?.type === "associate-membership" ||
  user?.account?.type === "overseas-membership";

export const isIndividualMemberRole = (user: UserInfo | undefined): boolean =>
  user?.account?.type === "individual-membership" ||
  user?.account?.type === "honorary";

export const isMemberRole = (user: UserInfo | undefined): boolean =>
  isGroupMemberRole(user) || isIndividualMemberRole(user);

export const isGroupDelegateRole = (user: UserInfo | undefined): boolean =>
  user?.delegate?.type === "group-delegate";

export const isDelegateRole = (user: UserInfo | undefined): boolean =>
  isGroupDelegateRole(user);

export const isGroupVoterRole = (user: UserInfo | undefined): boolean =>
  isGroupDelegateRole(user) || isGroupMemberRole(user);

export const isIndividualVoterRole = (user: UserInfo | undefined): boolean =>
  isIndividualMemberRole(user);

export const isCommitteeRole = (user: UserInfo | undefined): boolean =>
  user?.account?.type === "committee";

export const hasPermission = (
  user: UserInfo | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _permission: Permission
): boolean =>
  // Administrators have all permissions
  isAdministratorRole(user);

export const getPermissions = (user: UserInfo): Permission[] => {
  const allPermissions: Permission[] = [
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

export const hasAccountsReadAllPermission = (user: UserInfo | undefined) =>
  hasPermission(user, "ACCOUNTS_READ_ALL");

export const hasDelegatesReadAllPermission = (user: UserInfo | undefined) =>
  hasPermission(user, "DELEGATES_READ_ALL");

export const hasDelegatesReadAllMembersPermission = (
  user: UserInfo | undefined
) => hasPermission(user, "DELEGATES_READ_ALL_MEMBERS");
