import { LinkUserDetailsExpanded } from "../../interfaces/users";

type DelegateResponse = LinkUserDetailsExpanded;

export interface GroupDelegateResponse {
  delegateUserId: string;
  delegateUserLoginPath: string;
  eventId: number;
  label: string;
  delegateForAccountUserId: string;
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
