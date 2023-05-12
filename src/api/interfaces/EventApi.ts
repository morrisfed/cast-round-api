import { Event } from "../../interfaces/events";

interface EventResponse extends Event {}

export interface GetEventResponse {
  event: EventResponse;
}

export interface GetEventsResponse {
  events: readonly EventResponse[];
}

export interface CreateEventRequest {
  event: Omit<Event, "id">;
}

export interface CreateEventResponse {
  event: Event;
}
