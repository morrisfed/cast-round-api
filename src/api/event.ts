import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as A from "fp-ts/lib/Array";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { NonEmptyString } from "io-ts-types";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

import {
  createEventVote,
  getEvent,
  getEventVote,
  getEventVotes,
  updateEventVote,
} from "../events";
import {
  CreateVoteRequest,
  CreateVoteResponse,
  GetEventResponse,
  GetVoteResponse,
  GetVotesResponse,
  PatchVoteRequest,
  PatchVoteResponse,
} from "./interfaces/EventApi";
import { getEventGroupDelegate } from "../delegates";
import { GroupDelegateResponse } from "./interfaces/DelegateApi";
import { EventTellorsResponse } from "./interfaces/TellorApi";
import { getEventTellors, removeEventTellor } from "../tellors";

const EventIdObject = t.strict({
  eventId: IntFromString,
});
type EventIdObject = t.TypeOf<typeof EventIdObject>;

const EventIdAndTellorIdObject = t.strict({
  eventId: IntFromString,
  tellorId: NonEmptyString,
});
type EventIdAndTellorIdObject = t.TypeOf<typeof EventIdAndTellorIdObject>;

const EventIdAndVoteIdObject = t.strict({
  eventId: IntFromString,
  voteId: IntFromString,
});
type EventIdAndVoteIdObject = t.TypeOf<typeof EventIdAndVoteIdObject>;

export const eventRouter = express.Router({ mergeParams: true });

eventRouter.get<EventIdObject, GetEventResponse>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const getEventResponseTask = pipe(
      EventIdObject.decode(req.params),
      E.mapLeft(() => "bad-request" as const),
      TE.fromEither,
      TE.chainW(({ eventId }) => getEvent(req.user, eventId)),
      TE.map((event) => ({ event })),
      standardJsonResponseFold(res)
    );

    await getEventResponseTask();
  } else {
    throw new Error();
  }
});

eventRouter.get<EventIdObject, GetVotesResponse>("/votes", async (req, res) => {
  if (req.isAuthenticated()) {
    const getEventVotesResponseTask = pipe(
      EventIdObject.decode(req.params),
      E.mapLeft(() => "bad-request" as const),
      TE.fromEither,
      TE.chainW(({ eventId }) => getEventVotes(req.user, eventId)),
      TE.map((votes) => ({ votes })),
      standardJsonResponseFold(res)
    );

    await getEventVotesResponseTask();
  } else {
    throw new Error();
  }
});

eventRouter.get<EventIdObject, GroupDelegateResponse>(
  "/groupdelegate",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getGroupDelegateResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventGroupDelegate(req.user)(eventId)),
        TE.map((eventGroupDelegate) => ({
          delegateUserId: eventGroupDelegate.delegateUser.id,
          label: eventGroupDelegate.delegateUser.label,
          delegateUserLoginPath: `/api/auth/link/${eventGroupDelegate.delegateUserId}`,
          eventId: eventGroupDelegate.eventId,
          delegateForAccountUserId: eventGroupDelegate.delegateFor.id,
        })),
        standardJsonResponseFold(res)
      );

      await getGroupDelegateResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.get<EventIdObject, EventTellorsResponse>(
  "/tellors",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventTellorsResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventTellors(req.user)(eventId)),
        TE.map(
          A.map((tellor) => ({
            tellorUserId: tellor.tellorUserId,
            tellorUserLoginPath: `/api/auth/link/${tellor.tellorUserId}`,
            eventId: tellor.eventId,
            label: tellor.tellorUser.label,
          }))
        ),
        TE.map((tellors) => ({ tellors })),
        standardJsonResponseFold(res)
      );

      await getEventTellorsResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.delete<EventIdAndTellorIdObject>(
  "/tellors/:tellorId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const removeEventTellorResponseTask = pipe(
        EventIdAndTellorIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId, tellorId }) =>
          removeEventTellor(req.user)(eventId, tellorId)
        ),
        standardJsonResponseFold(res)
      );

      await removeEventTellorResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.post<EventIdObject, CreateVoteResponse, CreateVoteRequest>(
  "/votes",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const createVoteResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request"),
        TE.fromEither,
        TE.chainW(({ eventId }) =>
          createEventVote(req.user, req.params.eventId, {
            ...req.body.vote,
            eventId,
            status: "draft",
          })
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (vote) => {
            res.json({ vote });
            return T.of(undefined);
          }
        )
      );

      await createVoteResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.patch<EventIdAndVoteIdObject, PatchVoteResponse, PatchVoteRequest>(
  "/votes/:voteId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const updateVoteResponseTask = pipe(
        EventIdAndVoteIdObject.decode(req.params),
        E.mapLeft(() => "bad-request"),
        TE.fromEither,
        TE.chainW(({ eventId, voteId }) =>
          updateEventVote(req.user, eventId, voteId, req.body.voteUpdates)
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
          (vote) => {
            res.json({ vote });
            return T.of(undefined);
          }
        )
      );

      await updateVoteResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.get<{ eventId: number; voteId: number }, GetVoteResponse>(
  "/votes/:voteId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventVoteResponseTask = pipe(
        getEventVote(req.params.voteId),
        TE.map((vote) => ({ vote })),
        standardJsonResponseFold(res)
      );

      await getEventVoteResponseTask();
    } else {
      throw new Error();
    }
  }
);
