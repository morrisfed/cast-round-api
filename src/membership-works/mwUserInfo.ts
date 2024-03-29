import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as ROA from "fp-ts/lib/ReadonlyArray";

import { MembershipWorksUserProfile } from "./MembershipWorksTypes";
import { AccountUserWithDetails } from "../interfaces/users";
import { getMwUserProfileForToken } from "./fetchMwUserProfile";
import { bufferToMwUserProfiles } from "./readMwCsvBuffer";

export const mwUserProfileAsUserInfo = (
  userProfile: MembershipWorksUserProfile
): AccountUserWithDetails => ({
  id: `mw-${userProfile.account_id}`,
  enabled: true,
  source: "account",
  account: {
    id: `mw-${userProfile.account_id}`,
    name: userProfile.name,
    contactName: userProfile.contact_name,
    type: userProfile.type,
    isAdmin: userProfile.isAdmin,
  },
});

export const fetchUserInfoForMwAccessToken = (accessToken: string) =>
  pipe(getMwUserProfileForToken(accessToken), TE.map(mwUserProfileAsUserInfo));

export const csvBufferToUserInfos = (
  buffer: Buffer
): TE.TaskEither<Error, readonly AccountUserWithDetails[]> =>
  pipe(
    bufferToMwUserProfiles(buffer),
    TE.map(ROA.map(mwUserProfileAsUserInfo))
  );
