export interface DbMotion {
  id: number;
  sequence: number;
  eventId: number;
  status: string;
  title: string;
  description: string;
  voteDefinition: string;
}
