import {
  AccountUserDetails,
  DelegateUserDetailsWithCreatedBy,
} from "../../interfaces/UserInfo";

interface AccountResponse extends AccountUserDetails {}

export interface GetAccountResponse {
  account: AccountResponse;
}

export interface GetAccountsResponse {
  accounts: readonly AccountResponse[];
}

export interface GetAccountDelegatesResponse {
  delegates: readonly DelegateUserDetailsWithCreatedBy[];
}

export interface CreateAccountDelegateResponse {
  delegate: { id: string };
}
