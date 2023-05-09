import { DelegateUserInfo } from "../../interfaces/UserInfo";

interface DelegateResponse extends DelegateUserInfo {}

export interface GetDelegatesResponse {
  delegates: readonly DelegateResponse[];
}
