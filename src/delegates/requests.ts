export interface CreateGroupDelegateRequest {
  label: string;
  delegateForAccountId: string;
}

export interface CreateEventGroupDelegateRequest {
  eventId: number;
  label: string;
  delegateForAccountUserId: string;
}
