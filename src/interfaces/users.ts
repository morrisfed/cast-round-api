import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type LinkUserType = "group-delegate" | "tellor";
type UserSource = "account" | "link";

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
  links?: LinkUserDetailsNoExpansion[];
}

export interface LinkUserDetailsNoExpansion {
  id: string;
  label: string;
  type: LinkUserType;

  linkForUserId?: string | null;
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

export interface LinkUser extends User {
  source: "link";
}

export interface LinkUserWithDetails extends LinkUser {
  link: LinkUserDetails;
}

export interface BuildableLinkUser extends Omit<LinkUserWithDetails, "link"> {
  link: BuildableLinkUserDetails;
}
