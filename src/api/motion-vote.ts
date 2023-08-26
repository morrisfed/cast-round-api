import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import logger from "../utils/logging";

import {
  SubmitMotionVotesRequest,
  SubmitMotionVotesResponse,
  GetMotionVotesResponse,
} from "./interfaces/MotionVoteApi";
import {
  getUserMotionVotes,
  userSubmitOwnVotes,
} from "../votes/vote-submission";

const MotionIdObject = t.strict({
  motionId: IntFromString,
});
type MotionIdObject = t.TypeOf<typeof MotionIdObject>;

export const motionVoteRouter = express.Router({ mergeParams: true });

motionVoteRouter.get<MotionIdObject, GetMotionVotesResponse>(
  "/:motionId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getMotionVotesResponseTask = pipe(
        MotionIdObject.decode(req.params),
        TE.fromEither,
        TE.map((ids) => ids.motionId),
        TE.chainW(getUserMotionVotes(req.user)),
        TE.fold(
          (err) => {
            if (err === "not-found") {
              res.sendStatus(404);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (votes) => {
            res.json({ votes });
            return T.of(undefined);
          }
        )
      );

      await getMotionVotesResponseTask();
    } else {
      throw new Error();
    }
  }
);

motionVoteRouter.post<
  MotionIdObject,
  SubmitMotionVotesResponse,
  SubmitMotionVotesRequest
>("/:motionId", async (req, res) => {
  if (req.isAuthenticated()) {
    const submitMotionVoteResponseTask = pipe(
      E.Do,
      E.bind("ids", () => MotionIdObject.decode(req.params)),
      E.bind("submitMotionVoteRequest", () =>
        SubmitMotionVotesRequest.decode(req.body)
      ),
      E.mapLeft(() => "bad-request"),
      TE.fromEither,
      TE.chainW(({ ids, submitMotionVoteRequest }) =>
        userSubmitOwnVotes(
          req.user,
          ids.motionId,
          submitMotionVoteRequest.votes
        )
      ),
      TE.fold(
        (err) => {
          if (err === "forbidden") {
            res.sendStatus(403);
          } else if (err === "not-found") {
            res.sendStatus(404);
          } else if (err === "bad-request") {
            res.sendStatus(400);
          } else {
            res.sendStatus(500);
            logger.error(err);
          }
          return T.of(undefined);
        },
        (votes) => {
          res.json({ votes });
          return T.of(undefined);
        }
      )
    );

    await submitMotionVoteResponseTask();
  } else {
    throw new Error();
  }
});
