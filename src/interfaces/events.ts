import { AccountUserDetails, LinkUserDetails } from "./users";
import { Vote } from "./votes";

export interface Event {
  id: number;
  name: string;
  description: string;
  fromDate: Date;
  toDate: Date;
}

export interface EventWithVotes extends Event {
  votes: readonly Vote[];
}

export interface BuildableEvent extends Omit<Event, "id"> {}

export interface EventGroupDelegate {
  event: Event;
  delegateUser: LinkUserDetails;
  delegateFor: AccountUserDetails;

  eventId: number;
  delegateUserId: string;
  delegateForUserId: string;
}

export interface BuildableEventGroupDelegate
  extends Omit<EventGroupDelegate, "event" | "delegateUser" | "delegateFor"> {}
