import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";
import {
  ModelLinkUserClerkInfo,
  ModelLinkUserGroupDelegateInfo,
  ModelLinkUserTellorInfo,
} from "../model/interfaces/model-users";

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
  links?: LinkUserDetails[];
}

export interface LinkUserGroupDelegateDetails {
  id: string;
  label: string;
  type: "group-delegate";
  info: ModelLinkUserGroupDelegateInfo;

  createdByUserId: string;
}

export interface LinkUserTellorDetails {
  id: string;
  label: string;
  type: "tellor";
  info: ModelLinkUserTellorInfo;

  createdByUserId: string;
}

export interface LinkUserClerkDetails {
  id: string;
  label: string;
  type: "clerk";
  info: ModelLinkUserClerkInfo;

  createdByUserId: string;
}

export type LinkUserDetails =
  | LinkUserGroupDelegateDetails
  | LinkUserTellorDetails
  | LinkUserClerkDetails;

export type LinkUserDetailsExpanded = LinkUserDetails & {
  createdBy: User;
  linkFor: AccountUserDetails;
};

export type BuildableLinkUserDetails = LinkUserDetails;

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
  link?: LinkUserDetails;
}

export interface AccountUserWithDetails extends User {
  source: "account";
  account: AccountUserDetails;
}

export interface BuildableAccountUser
  extends Omit<AccountUserWithDetails, "account"> {
  account: BuildableAccountUserDetails;
}

export interface AccountUserWithLinks extends AccountUserWithDetails {
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

export type LoggedInUser = AccountUserWithDetails | LinkUserWithDetails;
