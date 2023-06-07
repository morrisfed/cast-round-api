import { LinkUserDetails } from "../../interfaces/users";

interface DelegateResponse extends LinkUserDetails {}

export interface GroupDelegateResponse {
  delegateUserId: string;
  delegateUserLoginUrl: string;
  eventId: number;
  label: string;
  delegateForAccountUserId: string;
}

export interface GetDelegatesResponse {
  delegates: readonly DelegateResponse[];
}

export interface CreateDelegateResponse {
  delegate: DelegateResponse;
}

export interface CreateEventGroupDelegateRequest {
  eventId: number;
  label: string;
  delegateForAccountUserId: string;
}

export type CreateEventGroupDelegateResponse = GroupDelegateResponse;
