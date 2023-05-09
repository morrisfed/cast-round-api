import { AccountUserInfo } from "../../interfaces/UserInfo";

interface AccountResponse extends AccountUserInfo {}

export interface GetAccountsResponse {
  accounts: readonly AccountResponse[];
}
