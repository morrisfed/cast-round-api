import * as t from "io-ts";

const EventClerkResponse = t.strict({
  clerkUserId: t.string,
  clerkUserLoginPath: t.string,
  eventId: t.number,
  label: t.string,
});
type EventClerkResponse = t.TypeOf<typeof EventClerkResponse>;

export interface EventClerksResponse {
  clerks: EventClerkResponse[];
}

export const CreateEventClerkRequest = t.strict({
  label: t.string,
});
export type CreateEventClerkRequest = t.TypeOf<typeof CreateEventClerkRequest>;

export type CreateEventClerkResponse = EventClerkResponse;
