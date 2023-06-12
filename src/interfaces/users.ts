import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type LinkUserType = "group-delegate" | "tellor";
export type UserSource = "account" | "link";

export type UserType = MembershipWorksUserType | LinkUserType;

export interface AccountUserDetails {
  id: string;
  name: string;
  contactName: string | null;
  type: MembershipWorksUserType;
  isAdmin: boolean;
}

export interface BuildableAccountUserDetails extends AccountUserDetails {}

export interface AccountUserDetailsWithLinks extends AccountUserDetails {
  links?: LinkUserDetails[];
}

export interface LinkUserDetailsNoExpansion {
  id: string;
  label: string;
  type: LinkUserType;

  linkForUserId?: string;
  createdByUserId?: string;
}

export interface LinkUserDetails extends LinkUserDetailsNoExpansion {
  createdBy: User;
  linkFor: AccountUserDetails;
}

export interface BuildableLinkUserDetails {
  id: string;
  label: string;
  type: LinkUserType;

  linkForUserId?: string;
  createdByUserId: string;
}

export interface LinkUserDetailsWithCreatedBy {
  label: string;
  createdBy: User;
  type: LinkUserType;
}

export interface User {
  id: string;
  enabled: boolean;
  source: UserSource;

  account?: AccountUserDetails;
  link?: LinkUserDetailsNoExpansion;
}

export interface AccountUser extends User {
  source: "account";
  account: AccountUserDetails;
}

export interface BuildableAccountUser extends Omit<AccountUser, "account"> {
  account: BuildableAccountUserDetails;
}

export interface AccountUserWithLinks extends AccountUser {
  account: AccountUserDetailsWithLinks;
}

export interface LinkUserNoExpansion extends User {
  source: "link";
  link: LinkUserDetailsNoExpansion;
}

export interface LinkUser extends LinkUserNoExpansion {
  link: LinkUserDetails;
}

export interface BuildableLinkUser extends Omit<LinkUser, "link"> {
  link: BuildableLinkUserDetails;
}
