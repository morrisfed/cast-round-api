import { DelegateUserDetails } from "../../interfaces/UserInfo";

interface DelegateResponse extends DelegateUserDetails {}

export interface GetDelegatesResponse {
  delegates: readonly DelegateResponse[];
}

export interface CreateDelegateResponse {
  delegate: DelegateResponse;
}
