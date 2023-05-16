import { Event } from "../../interfaces/events";
import { BuildableVote, Vote, VoteUpdates } from "../../interfaces/votes";

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

export interface VoteResponse extends Vote {}

export interface GetVoteResponse {
  vote: VoteResponse;
}

export interface GetVotesResponse {
  votes: readonly VoteResponse[];
}

export interface CreateVoteRequest {
  vote: Omit<BuildableVote, "eventId" | "status">;
}

export interface CreateVoteResponse {
  vote: Vote;
}

export interface PatchVoteRequest {
  voteUpdates: Omit<VoteUpdates, "status">;
}

export interface PatchVoteResponse {
  vote: Vote;
}
