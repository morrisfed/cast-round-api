import express from "express";
import multer from "multer";

import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { adminOnly } from "../authorisation/roleMiddleware";

import { MemberUploadResponse } from "./interfaces/AdminResponses";
import logger from "../utils/logging";
import { csvBufferToUserInfos } from "../membership-works/mwUserInfo";
import { importUsers } from "../user/importUsers";

const router = express.Router();
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

const requestFileAsBuffer = (
  file: Express.Multer.File | undefined
): E.Either<Error, Buffer> =>
  pipe(
    file,
    O.fromNullable,
    E.fromOption(() => new Error("No file uploaded")),
    E.map((f) => f.buffer)
  );

// Only users with the admin role can access this route.
router.use(adminOnly);

// Handle uploading of member CSV files and synchronise with the database.
// router.post<{}, MemberUploadResponse>(
router.post<{}, MemberUploadResponse>(
  "/member-upload",
  upload.single("csv"),
  async (req, res) => {
    const uploadTask = pipe(
      requestFileAsBuffer(req.file),
      TE.fromEither,
      TE.chain(csvBufferToUserInfos),
      TE.bindTo("uploadedUsers"),
      TE.bind("importResults", ({ uploadedUsers }) =>
        importUsers(uploadedUsers)
      ),
      TE.map(
        ({ uploadedUsers, importResults }) =>
          ({
            membersUploaded: uploadedUsers.length,
            membersCreated: importResults.created,
            membersUpdated: importResults.updated,
            errors: importResults.error,
            errorMessages: importResults.errorMessage,
          } as MemberUploadResponse)
      ),
      TE.fold(
        (err) => {
          res.sendStatus(500);
          logger.error(err);
          return TE.of(null);
        },
        (results) => {
          res.json(results);
          return TE.of(null);
        }
      )
    );

    await uploadTask();
  }
);

export default router;
