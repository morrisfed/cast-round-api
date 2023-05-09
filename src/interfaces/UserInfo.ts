import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type DelegateUserType = "group-delegate" | "tellor-delegate";
export type UserSource = "account" | "delegate";

export type UserType = MembershipWorksUserType | DelegateUserType;

export interface AccountUserInfo {
  id: string;
  name: string;
  contactName: string | null;
  type: MembershipWorksUserType;
}

export interface DelegateUserInfo {
  id: string;
  label: string;
  createdBy: UserInfo;
  type: DelegateUserType;
}

export interface UserInfo {
  id: string;
  enabled: boolean;
  source: UserSource;

  account?: AccountUserInfo;
  delegate?: DelegateUserInfo;
}
