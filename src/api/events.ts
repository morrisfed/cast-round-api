import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

import { createEvent, getEvent, getEvents } from "../events";
import {
  CreateEventRequest,
  CreateEventResponse,
  GetEventResponse,
  GetEventsResponse,
} from "./interfaces/EventApi";

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

eventsRouter.get<{ eventId: number }, GetEventResponse>(
  "/:eventId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventResponseTask = pipe(
        getEvent(req.user, req.params.eventId),
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
          (event) => {
            res.json({ event });
            return T.of(undefined);
          }
        )
      );

      await getEventResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventsRouter.post<
  { accountId: string },
  CreateEventResponse,
  CreateEventRequest
>("", async (req, res) => {
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
});
