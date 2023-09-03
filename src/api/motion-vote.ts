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
  GetMotionVoteTotalsResponse,
} from "./interfaces/MotionVoteApi";
import {
  getMemberMotionVotes,
  getMotionVoteTotals,
  submitMotionVotes,
} from "../votes/vote-submission";

const MotionIdObject = t.strict({
  motionId: IntFromString,
});
type MotionIdObject = t.TypeOf<typeof MotionIdObject>;

const MotionIdAndMemberIdObject = t.strict({
  motionId: IntFromString,
  memberId: t.string,
});
type MotionIdAndMemberIdObject = t.TypeOf<typeof MotionIdAndMemberIdObject>;

export const motionVoteRouter = express.Router({ mergeParams: true });

motionVoteRouter.get<MotionIdObject, GetMotionVoteTotalsResponse>(
  "/:motionId/totals",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getMotionVoteTotalsResponseTask = pipe(
        MotionIdObject.decode(req.params),
        TE.fromEither,
        TE.chainW((ids) =>
          getMotionVoteTotals(req.user.loggedInUser)(ids.motionId)
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "not-found") {
              res.sendStatus(404);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (subtotals) => {
            res.json({ subtotals });
            return T.of(undefined);
          }
        )
      );

      await getMotionVoteTotalsResponseTask();
    } else {
      throw new Error();
    }
  }
);

motionVoteRouter.get<MotionIdAndMemberIdObject, GetMotionVotesResponse>(
  "/:motionId/:memberId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getMotionVotesResponseTask = pipe(
        MotionIdAndMemberIdObject.decode(req.params),
        TE.fromEither,
        TE.chainW((ids) =>
          getMemberMotionVotes(req.user.loggedInUser)(
            ids.motionId,
            ids.memberId
          )
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "not-found") {
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
  MotionIdAndMemberIdObject,
  SubmitMotionVotesResponse,
  SubmitMotionVotesRequest
>("/:motionId/:memberId", async (req, res) => {
  if (req.isAuthenticated()) {
    const submitMotionVoteResponseTask = pipe(
      E.Do,
      E.bind("ids", () => MotionIdAndMemberIdObject.decode(req.params)),
      E.bind("submitMotionVoteRequest", () =>
        SubmitMotionVotesRequest.decode(req.body)
      ),
      E.mapLeft(() => "bad-request"),
      TE.fromEither,
      TE.chainW(({ ids, submitMotionVoteRequest }) =>
        submitMotionVotes(
          req.user.loggedInUser,
          ids.motionId,
          ids.memberId,
          submitMotionVoteRequest.votes
        )
      ),
      TE.fold(
        (err) => {
          if (err === "forbidden") {
            res.sendStatus(403);
          } else if (err === "not-found") {
            res.sendStatus(404);
          } else if (err === "bad-request" || err === "invalid-submission") {
            res.sendStatus(400);
          } else if (err === "conflict") {
            res.sendStatus(409);
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
