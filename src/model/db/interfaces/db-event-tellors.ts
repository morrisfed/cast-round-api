import { DbEvent } from "./db-events";
import { DbLinkUserDetails } from "./db-users";

export interface DbEventTellor {
  eventId: number;
  tellorUserId: string;

  event?: DbEvent;
  tellorUser?: DbLinkUserDetails;
}
