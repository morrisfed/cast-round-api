import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type DelegateUserType = "group-delegate" | "tellor-delegate";
export type UserSource = "account" | "delegate";

export type UserType = MembershipWorksUserType | DelegateUserType;

export interface AccountUserDetails {
  name: string;
  contactName: string | null;
  type: MembershipWorksUserType;
  isAdmin: boolean;
  userId: string;
}

export interface AccountUserDetailsWithDelegates extends AccountUserDetails {
  delegates?: DelegateUserDetails[];
}

export interface DelegateUserDetails {
  label: string;
  createdBy: User;
  delegateFor: AccountUserDetails;
  type: DelegateUserType;

  delegateForUserId?: string;
  createdByUserId?: string;
}

export interface BuildableDelegateUserDetails {
  label: string;
  type: DelegateUserType;

  delegateForUserId?: string;
  createdByUserId: string;
}

export interface DelegateUserDetailsWithCreatedBy {
  label: string;
  createdBy: User;
  type: DelegateUserType;
}

export interface User {
  id: string;
  enabled: boolean;
  source: UserSource;

  account?: AccountUserDetails;
  delegate?: DelegateUserDetails;
}

export interface AccountUser extends User {
  source: "account";
  account: AccountUserDetails;
}

export interface AccountUserWithDelegates extends AccountUser {
  account: AccountUserDetailsWithDelegates;
}

export interface DelegateUser extends User {
  source: "delegate";
  delegate: DelegateUserDetails;
}

export interface BuildableDelegateUser extends Omit<DelegateUser, "delegate"> {
  delegate: BuildableDelegateUserDetails;
}
