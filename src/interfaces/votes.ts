export type VoteStatus =
  | "draft"
  | "proxy"
  | "open"
  | "closed"
  | "cancelled"
  | "abandoned";

export interface Vote {
  id: number;
  eventId: number;
  status: VoteStatus;
  title: string;
  description: string;
}

export interface BuildableVote extends Omit<Vote, "id"> {}

export interface VoteUpdates extends Partial<Omit<BuildableVote, "eventId">> {}
