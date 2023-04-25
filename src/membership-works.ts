import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import axios from "axios";

import {
  MembershipWorksUser,
  MembershipWorksUserType,
} from "./interfaces/User";

interface MembershipWorksMembershipType {
  deck_id: string;
  label: string;
}

interface MembershipWorksUserInfoResponse {
  account_id: string;
  name: string;
  contact_name: string;
  membership: MembershipWorksMembershipType[];
}

const membershipTypeToUserType = (
  mwType: MembershipWorksMembershipType
): MembershipWorksUserType => {
  switch (mwType.deck_id) {
    case "5ba76209afd691c54b962bce":
      return "committee-member";
    case "5b0308c6afd6916a67e93226":
      return "group-member";
    case "5b0308e3afd6916867e93223":
      return "individual-member";
    default:
      return "other-member";
  }
};

const userInfoResponseToUser = (
  mwUserInfo: MembershipWorksUserInfoResponse
): MembershipWorksUser => ({
  account_id: mwUserInfo.account_id,
  name: mwUserInfo.name,
  contact_name: mwUserInfo.contact_name,
  type: membershipTypeToUserType(mwUserInfo.membership[0]),
});

const retrieveMwUserInfo = (
  accessToken: string
): TE.TaskEither<Error, MembershipWorksUserInfoResponse> =>
  pipe(
    TE.tryCatch(
      () =>
        axios.get<MembershipWorksUserInfoResponse>(
          "https://api.membershipworks.com/v2/oauth2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
      (reason) => new Error(`${reason}`)
    ),
    TE.map((response) => response.data)
  );

const getUserInfoForToken = (accessToken: string) =>
  pipe(retrieveMwUserInfo(accessToken), TE.map(userInfoResponseToUser));

export default getUserInfoForToken;
