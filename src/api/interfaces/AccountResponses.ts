import { AccountUserDetails } from "../../interfaces/users";
import { ModelRole } from "../../model/interfaces/model-roles";

interface AccountResponse extends AccountUserDetails {
  roles: ModelRole[];
}

export interface GetAccountResponse {
  account: AccountResponse;
}

export interface GetAccountsResponse {
  accounts: readonly AccountResponse[];
}

export interface CreateAccountDelegateResponse {
  delegate: { id: string };
}
