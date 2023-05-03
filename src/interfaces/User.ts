export type MembershipWorksUserType =
  | "associate-membership"
  | "committee"
  | "friend"
  | "group-membership"
  | "honorary"
  | "individual-membership"
  | "junior-membership"
  | "overseas-membership";

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

export interface User {
  id: string;
  enabled: boolean;
  name: string;
  contactName: string | null;
  type: UserType;
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
