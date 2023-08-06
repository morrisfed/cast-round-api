import { DbEvent } from "./db-events";
import { DbAccountUserDetails, DbLinkUserDetails } from "./db-users";

export interface DbEventGroupDelegate {
  event: DbEvent;
  delegateUser: DbLinkUserDetails;
  delegateFor: DbAccountUserDetails;

  eventId: number;
  delegateUserId: string;
  delegateForUserId: string;
}
