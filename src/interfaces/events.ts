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
