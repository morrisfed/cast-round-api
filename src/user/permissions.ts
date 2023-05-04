import { UserInfo } from "../interfaces/UserInfo";
import env from "../utils/env";

export type Permission =
  | "IMPORT_MEMBERS_CSV"
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
  user?.type === "group-membership" ||
  user?.type === "junior-membership" ||
  user?.type === "associate-membership" ||
  user?.type === "overseas-membership";

export const isIndividualMemberRole = (user: UserInfo | undefined): boolean =>
  user?.type === "individual-membership" || user?.type === "honorary";

export const isMemberRole = (user: UserInfo | undefined): boolean =>
  isGroupMemberRole(user) || isIndividualMemberRole(user);

export const isGroupDelegateRole = (user: UserInfo | undefined): boolean =>
  user?.type === "group-delegate";

export const isDelegateRole = (user: UserInfo | undefined): boolean =>
  isGroupDelegateRole(user);

export const isGroupVoterRole = (user: UserInfo | undefined): boolean =>
  isGroupDelegateRole(user) || isGroupMemberRole(user);

export const isIndividualVoterRole = (user: UserInfo | undefined): boolean =>
  isIndividualMemberRole(user);

export const isCommitteeRole = (user: UserInfo | undefined): boolean =>
  user?.type === "committee";

export const hasPermission = (
  user: UserInfo | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _permission: Permission
): boolean =>
  // Administrators have all permissions
  isAdministratorRole(user);

export const getPermissions = (user: UserInfo): Permission[] => {
  const allPermissions: Permission[] = [
    "IMPORT_MEMBERS_CSV",
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
