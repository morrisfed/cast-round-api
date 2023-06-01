import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

import {
  createEvent,
  createEventVote,
  getEvent,
  getEventVote,
  getEventVotes,
  getEvents,
  updateEventVote,
} from "../events";
import {
  CreateEventRequest,
  CreateEventResponse,
  CreateVoteRequest,
  CreateVoteResponse,
  GetEventResponse,
  GetEventsResponse,
  GetVoteResponse,
  GetVotesResponse,
  PatchVoteRequest,
  PatchVoteResponse,
} from "./interfaces/EventApi";

const EventIdObject = t.strict({
  eventId: IntFromString,
});
type EventIdObject = t.TypeOf<typeof EventIdObject>;

const EventIdAndVoteIdObject = t.strict({
  eventId: IntFromString,
  voteId: IntFromString,
});
type EventIdAndVoteIdObject = t.TypeOf<typeof EventIdAndVoteIdObject>;

export const eventsRouter = express.Router();

eventsRouter.get<{}, GetEventsResponse>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const getEventsResponseTask = pipe(
      getEvents(req.user),
      TE.map((events) => ({ events })),
      standardJsonResponseFold(res)
    );

    await getEventsResponseTask();
  } else {
    throw new Error();
  }
});

eventsRouter.get<EventIdObject, GetEventResponse>(
  "/:eventId",
  async (req, res) => {
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
  }
);

eventsRouter.post<{}, CreateEventResponse, CreateEventRequest>(
  "",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const createEventResponseTask = pipe(
        createEvent(req.user)(req.body.event),
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
          (event) => {
            res.json({ event });
            return T.of(undefined);
          }
        )
      );

      await createEventResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventsRouter.get<EventIdObject, GetVotesResponse>(
  "/:eventId/votes",
  async (req, res) => {
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
  }
);

eventsRouter.post<EventIdObject, CreateVoteResponse, CreateVoteRequest>(
  "/:eventId/votes",
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

eventsRouter.patch<EventIdAndVoteIdObject, PatchVoteResponse, PatchVoteRequest>(
  "/:eventId/votes/:voteId",
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

eventsRouter.get<{ eventId: number; voteId: number }, GetVoteResponse>(
  "/:eventId/votes/:voteId",
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
