import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import {
  CreateEventClerkRequest,
  CreateEventClerkResponse,
  EventClerksResponse,
} from "./interfaces/EventClerkApi";
import { createEventClerk, getEventClerks, removeEventClerk } from "../clerks";

const EventIdObject = t.strict({
  eventId: IntFromString,
});
type EventIdObject = t.TypeOf<typeof EventIdObject>;

const EventIdAndClerkIdObject = t.strict({
  eventId: IntFromString,
  clerkId: t.string,
});
type EventIdAndClerkIdObject = t.TypeOf<typeof EventIdAndClerkIdObject>;

export const eventClerksRouter = express.Router({ mergeParams: true });

eventClerksRouter.get<EventIdObject, EventClerksResponse>(
  "/",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventClerksResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventClerks(req.user)(eventId)),
        TE.map(
          A.map((clerk) => ({
            clerkUserId: clerk.clerkUserId,
            clerkUserLoginPath: `/api/auth/link/${clerk.clerkUserId}`,
            eventId: clerk.eventId,
            label: clerk.clerkUser.label,
          }))
        ),
        TE.map((clerks) => ({ clerks })),
        standardJsonResponseFold(res)
      );

      await getEventClerksResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventClerksRouter.post<
  EventIdObject,
  CreateEventClerkResponse,
  CreateEventClerkRequest
>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const createEventClerkResponseTask = pipe(
      E.Do,
      E.bind("ids", () => EventIdObject.decode(req.params)),
      E.bind("createEventClerkRequest", () =>
        CreateEventClerkRequest.decode(req.body)
      ),
      E.mapLeft(() => "bad-request" as const),
      TE.fromEither,
      TE.chainW(({ ids, createEventClerkRequest }) =>
        createEventClerk(req.user.loggedInUser)(
          ids.eventId,
          createEventClerkRequest.label
        )
      ),
      TE.map((clerk) => ({
        clerkUserId: clerk.clerkUserId,
        clerkUserLoginPath: `/api/auth/link/${clerk.clerkUserId}`,
        eventId: clerk.eventId,
        label: clerk.clerkUser.label,
      })),
      standardJsonResponseFold(res)
    );

    await createEventClerkResponseTask();
  } else {
    throw new Error();
  }
});

eventClerksRouter.delete<EventIdAndClerkIdObject>(
  "/:clerkId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const removeEventClerkResponseTask = pipe(
        EventIdAndClerkIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId, clerkId }) =>
          removeEventClerk(req.user)(eventId, clerkId)
        ),
        standardJsonResponseFold(res)
      );

      await removeEventClerkResponseTask();
    } else {
      throw new Error();
    }
  }
);
