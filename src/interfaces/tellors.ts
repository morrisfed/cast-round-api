import { Event } from "./events";
import { LinkUserDetailsNoExpansion } from "./users";

export interface EventTellorNoExpansion {
  eventId: number;
  tellorUserId: string;
}

export interface EventTellor extends EventTellorNoExpansion {
  event: Event;
  tellorUser: LinkUserDetailsNoExpansion;
}

export interface BuildableEventTellor
  extends Omit<EventTellor, "event" | "tellorUser"> {}
