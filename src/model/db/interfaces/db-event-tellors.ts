import { DbEvent } from "./db-events";
import { DbLinkUserDetailsNoExpansion } from "./db-users";

export interface DbEventTellor {
  eventId: number;
  tellorUserId: string;

  event?: DbEvent;
  tellorUser?: DbLinkUserDetailsNoExpansion;
}
