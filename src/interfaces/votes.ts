export type VoteStatus =
  | "draft"
  | "proxy"
  | "open"
  | "closed"
  | "cancelled"
  | "abandoned";

export interface Vote {
  status: VoteStatus;
  title: string;
  description: string;
}
