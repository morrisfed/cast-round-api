import neatCsv from "neat-csv";
import removeUTF8BOM from "@stdlib/string-remove-utf8-bom";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  MembershipWorksUserProfile,
  MembershipWorksUserType,
} from "./MembershipWorksTypes";

interface MemberCsvRow {
  "Account Name": string;
  "Contact Name": string;
  "Associate Membership": string;
  Committee: string;
  Friend: string;
  "Group Membership": string;
  Honorary: string;
  "Individual Membership": string;
  "Junior Membership": string;
  "Overseas Membership": string;
  "Account ID": string;
}

const memberRowToUserType = (
  row: MemberCsvRow
): E.Either<Error, MembershipWorksUserType> => {
  if (row["Associate Membership"]) {
    return E.right("associate-membership");
  }
  if (row.Committee) {
    return E.right("committee");
  }
  if (row.Friend) {
    return E.right("friend");
  }
  if (row["Group Membership"]) {
    return E.right("group-membership");
  }
  if (row.Honorary) {
    return E.right("honorary");
  }
  if (row["Individual Membership"]) {
    return E.right("individual-membership");
  }
  if (row["Junior Membership"]) {
    return E.right("junior-membership");
  }
  if (row["Overseas Membership"]) {
    return E.right("overseas-membership");
  }
  return E.left(new Error("No membership type found"));
};

const memberRowToFieldValue =
  (fieldName: keyof MemberCsvRow) =>
  (required: boolean) =>
  (row: MemberCsvRow): E.Either<Error, string> => {
    const value = row[fieldName];
    if (required && !value) {
      return E.left(new Error(`No value found for ${fieldName}`));
    }
    return E.right(value);
  };

const memberRowToUser = (
  row: MemberCsvRow
): E.Either<Error, MembershipWorksUserProfile> =>
  pipe(
    sequenceS(E.Apply)({
      account_id: memberRowToFieldValue("Account ID")(true)(row),
      name: memberRowToFieldValue("Account Name")(true)(row),
      contact_name: memberRowToFieldValue("Contact Name")(false)(row),
      type: memberRowToUserType(row),
    })
  );

const bufferToMembersCsv = (
  buffer: Buffer
): TE.TaskEither<Error, MemberCsvRow[]> =>
  TE.tryCatch(
    () => neatCsv<MemberCsvRow>(removeUTF8BOM(buffer.toString())),
    (err) => new Error(`Failed to parse CSV: ${err}`)
  );

export const bufferToMwUserProfiles = (
  buffer: Buffer
): TE.TaskEither<Error, readonly MembershipWorksUserProfile[]> =>
  pipe(
    bufferToMembersCsv(buffer),
    TE.flatMap((rows) =>
      TE.traverseArray(TE.fromEitherK(memberRowToUser))(rows)
    )
  );
