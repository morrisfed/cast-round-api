export type MembershipWorksUserType =
  | "associate-membership"
  | "committee"
  | "friend"
  | "group-membership"
  | "honorary"
  | "individual-membership"
  | "junior-membership"
  | "overseas-membership";

export interface MembershipWorksUserProfile {
  account_id: string;
  name: string;
  contact_name: string;
  type: MembershipWorksUserType;
}
