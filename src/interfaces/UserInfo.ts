import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type DelegateUserType = "group-delegate" | "tellor-delegate";
export type UserSource = "account" | "delegate";

export type UserType = MembershipWorksUserType | DelegateUserType;

export interface AccountUserInfo {
  name: string;
  contactName: string | null;
  type: MembershipWorksUserType;
}

export interface DelegateUserInfo {
  label: string;
  createdBy: UserInfo;
  type: DelegateUserType;
}

// export interface CommonUserInfo {
//   id: string;
//   enabled: boolean;
//   source: UserSource;
// }

// export type UserInfo = CommonUserInfo & (AccountUserInfo | DelegateUserInfo);

export interface UserInfo {
  id: string;
  enabled: boolean;
  source: UserSource;

  account?: AccountUserInfo;
  delegate?: DelegateUserInfo;
}
