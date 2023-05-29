import { AccountUserDetails } from "../interfaces/users";

export const isGroupAccountType = (
  accountType: AccountUserDetails["type"] | undefined
): boolean =>
  accountType === "group-membership" ||
  accountType === "junior-membership" ||
  accountType === "associate-membership" ||
  accountType === "overseas-membership";

export const isIndividualAccountType = (
  accountType: AccountUserDetails["type"] | undefined
): boolean =>
  accountType === "individual-membership" || accountType === "honorary";
