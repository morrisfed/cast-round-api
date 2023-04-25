export type MembershipWorksUserType =
  | "individual-member"
  | "group-member"
  | "committee-member"
  | "other-member";

export type UserType =
  | MembershipWorksUserType
  | "group-delegate"
  | "tellor-delegate";

export interface MembershipWorksUser {
  account_id: string;
  name: string;
  contact_name: string;
  type: MembershipWorksUserType;
}

// Add our custom user type to the Express namespace
declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      type: UserType;
      authVia: "membership-works" | "delegate";
    }
  }
}
