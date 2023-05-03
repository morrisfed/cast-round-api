// Committee members are administrators.
export const isAdmin = (user: Express.User | undefined) =>
  user?.type === "committee";

// Members are users that have logged in through MembershipWorks.
export const isMember = (user: Express.User | undefined) =>
  user?.authVia === "membership-works";
