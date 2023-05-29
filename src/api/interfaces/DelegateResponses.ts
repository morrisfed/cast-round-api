import { LinkUserDetails } from "../../interfaces/users";

interface DelegateResponse extends LinkUserDetails {}

export interface GetDelegatesResponse {
  delegates: readonly DelegateResponse[];
}

export interface CreateDelegateResponse {
  delegate: DelegateResponse;
}
