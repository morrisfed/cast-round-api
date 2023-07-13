import { Event, EventWithMotions } from "../../interfaces/events";
import {
  BuildableMotion,
  Motion,
  MotionUpdates,
} from "../../interfaces/motions";

interface EventResponse extends Event {}

interface EventWithMotionsResponse extends EventResponse {
  motions: readonly Motion[];
}

export interface GetEventResponse {
  event: EventWithMotionsResponse;
}

export interface GetEventsResponse {
  events: readonly EventResponse[];
}

export interface CreateEventRequest {
  event: Omit<Event, "id">;
}

export interface CreateEventResponse {
  event: EventWithMotions;
}

export interface MotionResponse extends Motion {}

export interface GetMotionResponse {
  motion: MotionResponse;
}

export interface GetMotionsResponse {
  motions: readonly MotionResponse[];
}

export interface CreateMotionRequest {
  motion: Omit<BuildableMotion, "eventId" | "status">;
}

export interface CreateMotionResponse {
  motion: Motion;
}

export interface PatchMotionRequest {
  motionUpdates: Omit<MotionUpdates, "status">;
}

export interface PatchMotionResponse {
  motion: Motion;
}
