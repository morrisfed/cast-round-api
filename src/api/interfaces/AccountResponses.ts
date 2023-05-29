import {
  AccountUserDetails,
  LinkUserDetailsWithCreatedBy,
} from "../../interfaces/users";

interface AccountResponse extends AccountUserDetails {}

export interface GetAccountResponse {
  account: AccountResponse;
}

export interface GetAccountsResponse {
  accounts: readonly AccountResponse[];
}

export interface GetAccountDelegatesResponse {
  delegates: readonly LinkUserDetailsWithCreatedBy[];
}

export interface CreateAccountDelegateResponse {
  delegate: { id: string };
}
