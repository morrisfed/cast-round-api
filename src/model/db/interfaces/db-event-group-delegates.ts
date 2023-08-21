import { DbEvent } from "./db-events";
import { DbAccountUserDetails, DbLinkUserDetailsExpanded } from "./db-users";

export interface DbEventGroupDelegate {
  event: DbEvent;
  delegateUser: DbLinkUserDetailsExpanded;
  delegateFor: DbAccountUserDetails;

  eventId: number;
  delegateUserId: string;
  delegateForUserId: string;
}
