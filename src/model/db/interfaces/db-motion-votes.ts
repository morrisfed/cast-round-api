export interface DbMotionVote {
  id: number;
  motionId: number;
  onBehalfOfUserId: string;
  submittedByUserId: string;
  responseCode: string;
  votes: number;
}
