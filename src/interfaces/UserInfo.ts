import { MembershipWorksUserType } from "../membership-works/MembershipWorksTypes";

export type UserType =
  | MembershipWorksUserType
  | "group-delegate"
  | "tellor-delegate";

export interface UserInfo {
  id: string;
  enabled: boolean;
  name: string;
  contactName: string | null;
  type: UserType;
}
