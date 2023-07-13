import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

import { createEvent, getEvents } from "../events";
import {
  CreateEventRequest,
  CreateEventResponse,
  GetEventsResponse,
} from "./interfaces/EventApi";
import { eventRouter } from "./event";

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

eventsRouter.use("/:eventId", eventRouter);
