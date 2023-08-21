import { AccountUserDetails, LinkUserDetails } from "./users";
import { Motion } from "./motions";

export interface Event {
  id: number;
  name: string;
  description: string;
  fromDate: Date;
  toDate: Date;
}

export interface EventWithMotions extends Event {
  motions: readonly Motion[];
}

export interface BuildableEvent extends Omit<Event, "id"> {}

export interface EventGroupDelegate {
  delegateUser: LinkUserDetails;
  delegateFor: AccountUserDetails;

  eventId: number;
  delegateUserId: string;
  delegateForUserId: string;
}

export interface BuildableEventGroupDelegate
  extends Omit<EventGroupDelegate, "event" | "delegateUser" | "delegateFor"> {}

export interface EventUpdates extends Partial<BuildableEvent> {}
