import * as t from "io-ts";

import { Event, EventUpdates, EventWithMotions } from "../../interfaces/events";
import {
  BuildableMotion,
  Motion,
  MotionStatus,
  MotionUpdates,
} from "../../interfaces/motions";
import { GetMotionVotesResponse } from "./MotionVoteApi";

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

export interface PatchEventRequest {
  eventUpdates: EventUpdates;
}

export interface PatchEventResponse {
  event: Event;
}

export interface MotionResponse extends Motion {
  votes?: GetMotionVotesResponse["votes"];
}

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

const MotionStatusRequest = t.union([
  t.literal("draft"),
  t.literal("proxy"),
  t.literal("open"),
  t.literal("closed"),
  t.literal("cancelled"),
  t.literal("discarded"),
]);

export const SetMotionStatusRequest = t.strict({
  status: MotionStatusRequest,
});
export type SetMotionStatusRequest = t.TypeOf<typeof SetMotionStatusRequest>;

export interface SetMotionStatusResponse {
  status: MotionStatus;
}
