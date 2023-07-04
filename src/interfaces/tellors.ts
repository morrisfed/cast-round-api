import { Event } from "./events";
import { LinkUserDetails } from "./users";

export interface EventTellorNoExpansion {
  eventId: number;
  tellorUserId: string;
}

export interface EventTellor extends EventTellorNoExpansion {
  event: Event;
  tellorUser: LinkUserDetails;
}

export interface BuildableEventTellor
  extends Omit<EventTellor, "event" | "tellorUser"> {}
