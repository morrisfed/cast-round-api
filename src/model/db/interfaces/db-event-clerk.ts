import { DbEvent } from "./db-events";
import { DbLinkUserDetails } from "./db-users";

export interface DbEventClerk {
  eventId: number;
  clerkUserId: string;

  event?: DbEvent;
  clerkUser?: DbLinkUserDetails;
}
