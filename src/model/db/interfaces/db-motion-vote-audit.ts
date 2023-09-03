export interface DbMotionVoteAudit {
  voteId: number;
  submissionId: string;

  motionId: number;
  responseCode: string;
  votes: number;
  advancedVote: boolean;

  accountUserId: string;
  accountUserName: string;
  accountUserContact: string;
  accountUserType: string;

  submittedByUserId: string;
  submittedByUserType: string;
  submittedByUserName: string;

  replacedPreviousVotes: string;

  submittedAt: Date;
}
