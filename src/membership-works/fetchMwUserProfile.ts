import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import axios from "axios";
import {
  MembershipWorksUserProfile,
  MembershipWorksUserType,
} from "./MembershipWorksTypes";

export type MwUnrecognisedMembershipType = {
  tag: "mw-unrecognised-membership-type";
  deckId: string;
};

export type MwProfileParseError = {
  tag: "mw-profile-parse-error";
  accountId: string;
  name: string;
  contactName: string;
  deckId: string;
  cause?: MwUnrecognisedMembershipType;
};

export function isMwUnrecognisedMembershipType(
  err: any
): err is MwUnrecognisedMembershipType {
  return err.tag === "mw-unrecognised-membership-type";
}

export function isMwProfileParseError(err: any): err is MwProfileParseError {
  return err.tag === "mw-profile-parse-error";
}

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

const deckIdToUserTypeMap: Record<string, MembershipWorksUserType> = {
  "5b0307e3f033bfe655b03819": "associate-membership",
  "5ba76209afd691c54b962bce": "committee",
  "5ba7684bafd691ed4c962bce": "friend",
  "5b0308c6afd6916a67e93226": "group-membership",
  "5ba7628bafd691e54b962bce": "honorary",
  "5b0308e3afd6916867e93223": "individual-membership",
  "5b0307d7f033bfb555b03819": "junior-membership",
  "5b0308f6afd6916a67e93229": "overseas-membership",
};

const membershipTypeToUserType = (
  mwType: MembershipWorksMembershipType
): E.Either<MwUnrecognisedMembershipType, MembershipWorksUserType> =>
  pipe(
    deckIdToUserTypeMap[mwType.deck_id],
    E.fromNullable({
      tag: "mw-unrecognised-membership-type",
      deckId: mwType.deck_id,
    })
  );

const userInfoResponseToUser = (
  mwUserInfo: MembershipWorksUserInfoResponse
): E.Either<MwProfileParseError, MembershipWorksUserProfile> =>
  pipe(
    sequenceS(E.Apply)({
      account_id: E.of(mwUserInfo.account_id),
      name: E.of(mwUserInfo.name),
      contact_name: E.of(mwUserInfo.contact_name),
      type: membershipTypeToUserType(mwUserInfo.membership[0]),
    }),
    E.mapLeft((e) => ({
      tag: "mw-profile-parse-error",
      accountId: mwUserInfo.account_id,
      name: mwUserInfo.name,
      contactName: mwUserInfo.contact_name,
      deckId: e.deckId,
      cause: e,
    }))
  );

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

export const getMwUserProfileForToken = (accessToken: string) =>
  pipe(
    retrieveMwUserInfo(accessToken),
    TE.chainEitherKW(userInfoResponseToUser)
  );
