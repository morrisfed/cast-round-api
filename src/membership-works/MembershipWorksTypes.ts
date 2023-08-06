import * as t from "io-ts";

export const MembershipWorksUserType = t.union([
  t.literal("associate-membership"),
  t.literal("committee"),
  t.literal("friend"),
  t.literal("group-membership"),
  t.literal("honorary"),
  t.literal("individual-membership"),
  t.literal("junior-membership"),
  t.literal("overseas-membership"),
]);

export type MembershipWorksUserType = t.TypeOf<typeof MembershipWorksUserType>;

export interface MembershipWorksUserProfile {
  account_id: string;
  name: string;
  contact_name: string;
  type: MembershipWorksUserType;
  isAdmin: boolean;
}
